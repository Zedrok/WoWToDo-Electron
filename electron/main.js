const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const https = require('https')
const { spawn } = require('child_process')
const { v4: uuidv4 } = require('uuid')

// ─── GitHub repo for update checks ───────────────────────────────────────────
const GITHUB_OWNER = 'Zedrok'
const GITHUB_REPO  = 'WoWToDo-Electron'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Data file path:
// - dev: next to project root
// - portable prod: next to the .exe (electron-builder sets PORTABLE_EXECUTABLE_DIR)
// - installed prod fallback: userData dir
const DATA_FILE = isDev
  ? path.join(__dirname, '..', 'wow_todo_data.json')
  : process.env.PORTABLE_EXECUTABLE_DIR
    ? path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'wow_todo_data.json')
    : path.join(app.getPath('userData'), 'wow_todo_data.json')

// ─── DataManager ─────────────────────────────────────────────────────────────

const DAILY_RESET_HOUR = 15
const WEEKLY_RESET_WEEKDAY = 2 // Tuesday (0=Mon in JS Date... we use UTC day)

function emptyData() {
  return { characters: [], tasks: [], last_daily_reset: null, last_weekly_reset: null }
}

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    } catch {}
  }
  return emptyData()
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

function migrate(data) {
  data.characters = data.characters || []
  data.tasks = data.tasks || []
  data.last_daily_reset = data.last_daily_reset || null
  data.last_weekly_reset = data.last_weekly_reset || null

  for (const char of data.characters) {
    char.id = char.id || uuidv4()
    char.hidden_task_ids = char.hidden_task_ids || []
    if (char.class_id === undefined) char.class_id = null
  }

  // Migrate per-character tasks → global tasks
  for (const char of data.characters) {
    if (char.tasks && char.tasks.length > 0) {
      for (const task of char.tasks) {
        const tid = task.id
        if (!tid) continue
        let gt = data.tasks.find(t => t.id === tid)
        if (!gt) {
          gt = { id: tid, name: task.name || 'Unnamed', periodicity: task.periodicity || 'daily', completion: {} }
          data.tasks.push(gt)
        }
        gt.completion = gt.completion || {}
        gt.completion[char.id] = {
          completed: task.completed || false,
          last_completed: task.last_completed || null,
          history: task.history || []
        }
      }
      delete char.tasks
    }
  }

  // Ensure all characters have completion entries for all tasks
  for (const task of data.tasks) {
    task.completion = task.completion || {}
    for (const char of data.characters) {
      if (!task.completion[char.id]) {
        task.completion[char.id] = { status: 0, last_completed: null, history: [] }
      }
    }
  }

  // Migrate completed boolean → status number (0=empty, 1=in-progress, 2=completed)
  for (const task of data.tasks) {
    for (const cid of Object.keys(task.completion || {})) {
      const compl = task.completion[cid]
      if (typeof compl.completed === 'boolean') {
        compl.status = compl.completed ? 2 : 0
        delete compl.completed
      }
      if (compl.status === undefined) compl.status = 0
    }
  }

  // Migrate tabs
  if (!data.tabs || data.tabs.length === 0) {
    const defaultTab = { id: uuidv4(), name: 'General', color: '#c59953', icon_type: 'letter', icon_value: null }
    data.tabs = [defaultTab]
  }
  const firstTabId = data.tabs[0].id
  for (const task of data.tasks) {
    if (!task.tab_id) task.tab_id = firstTabId
  }

  // Migrate: ensure state_count exists on all tasks
  for (const task of data.tasks) {
    if (!task.state_count) task.state_count = 3
  }

  // Migrate: ensure profession_id exists on all tasks
  for (const task of data.tasks) {
    if (task.profession_id === undefined) task.profession_id = null
  }

  // Migrate: ensure custom_image exists on all tasks
  for (const task of data.tasks) {
    if (task.custom_image === undefined) task.custom_image = null
  }

  // Migrate: ensure track_profit exists on all tasks
  for (const task of data.tasks) {
    if (task.track_profit === undefined) task.track_profit = false
  }

  // Migrate: ensure profit_display exists on daily tasks with track_profit
  for (const task of data.tasks) {
    if (task.track_profit && task.periodicity === 'daily' && task.profit_display === undefined) {
      task.profit_display = 'both'
    }
  }

  // Migrate: ensure profit_log exists in all completion entries
  for (const task of data.tasks) {
    for (const cid of Object.keys(task.completion || {})) {
      const compl = task.completion[cid]
      if (!compl.profit_log) compl.profit_log = {}
    }
  }

  // Migrate tabs to new icon scheme (icon_type / icon_value)
  for (const tab of data.tabs) {
    if (!tab.icon_type) {
      tab.icon_type = 'letter'
      tab.icon_value = null
      delete tab.icon
    }
  }

  return data
}

function lastDailyReset() {
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), DAILY_RESET_HOUR, 0, 0))
  return now >= today ? today : new Date(today.getTime() - 86400000)
}

function lastWeeklyReset() {
  const now = new Date()
  // WEEKLY_RESET_WEEKDAY: 1 = Tuesday in UTC (0=Mon, 1=Tue in getUTCDay with Sunday=0... so Tuesday=2)
  const TUESDAY = 2
  let daysBack = (now.getUTCDay() - TUESDAY + 7) % 7
  const candidate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysBack, DAILY_RESET_HOUR, 0, 0))
  return now >= candidate ? candidate : new Date(candidate.getTime() - 7 * 86400000)
}

function nextDailyReset() {
  const now = new Date()
  const candidate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), DAILY_RESET_HOUR, 0, 0))
  return now < candidate ? candidate : new Date(candidate.getTime() + 86400000)
}

function nextWeeklyReset() {
  const now = new Date()
  const TUESDAY = 2
  let daysFwd = (TUESDAY - now.getUTCDay() + 7) % 7
  const candidate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysFwd, DAILY_RESET_HOUR, 0, 0))
  return candidate > now ? candidate : new Date(candidate.getTime() + 7 * 86400000)
}

function resetType(data, ptype) {
  for (const task of data.tasks) {
    if ((task.periodicity || '').toLowerCase() === ptype) {
      for (const cid of Object.keys(task.completion || {})) {
        task.completion[cid].status = 0
      }
    }
  }
}

function applyResets(data) {
  let changed = false
  const daily = lastDailyReset()
  const storedDaily = data.last_daily_reset ? new Date(data.last_daily_reset) : new Date(0)
  if (storedDaily < daily) {
    resetType(data, 'daily')
    data.last_daily_reset = daily.toISOString()
    changed = true
  }
  const weekly = lastWeeklyReset()
  const storedWeekly = data.last_weekly_reset ? new Date(data.last_weekly_reset) : new Date(0)
  if (storedWeekly < weekly) {
    resetType(data, 'weekly')
    data.last_weekly_reset = weekly.toISOString()
    changed = true
  }
  if (changed) saveData(data)
  return changed
}

// ─── State ───────────────────────────────────────────────────────────────────

let appData = migrate(loadData())
applyResets(appData)

// ─── IPC Handlers ────────────────────────────────────────────────────────────

ipcMain.handle('get-data', () => appData)

ipcMain.handle('get-resets', () => ({
  nextDaily: nextDailyReset().toISOString(),
  nextWeekly: nextWeeklyReset().toISOString()
}))

ipcMain.handle('check-resets', () => {
  const changed = applyResets(appData)
  return { changed, data: appData }
})

ipcMain.handle('add-character', (_, { name, classId }) => {
  const char = { id: uuidv4(), name: name.trim(), hidden_task_ids: [], class_id: classId || null }
  appData.characters.push(char)
  for (const task of appData.tasks) {
    task.completion[char.id] = { status: 0, last_completed: null, history: [], profit_log: {} }
  }
  saveData(appData)
  return appData
})

ipcMain.handle('rename-character', (_, { cid, name, hiddenTaskIds, classId }) => {
  const char = appData.characters.find(c => c.id === cid)
  if (char) {
    char.name = name.trim()
    char.hidden_task_ids = Array.isArray(hiddenTaskIds) ? hiddenTaskIds : []
    char.class_id = classId || null
    saveData(appData)
  }
  return appData
})

ipcMain.handle('delete-character', (_, cid) => {
  appData.characters = appData.characters.filter(c => c.id !== cid)
  for (const task of appData.tasks) {
    delete task.completion[cid]
  }
  saveData(appData)
  return appData
})

ipcMain.handle('add-task', (_, { name, periodicity, tab_id, state_count, profession_id, custom_image, track_profit, profit_display }) => {
  const period = periodicity.toLowerCase()
  const task = { id: uuidv4(), name: name.trim(), periodicity: period, tab_id: tab_id || appData.tabs[0]?.id, state_count: state_count || 3, profession_id: profession_id || null, custom_image: custom_image || null, track_profit: track_profit === true, profit_display: (track_profit && period === 'daily') ? (profit_display || 'both') : undefined, completion: {} }
  for (const char of appData.characters) {
    task.completion[char.id] = { status: 0, last_completed: null, history: [], profit_log: {} }
  }
  appData.tasks.push(task)
  saveData(appData)
  return appData
})

ipcMain.handle('edit-task', (_, { tid, name, periodicity, state_count, profession_id, custom_image, track_profit, profit_display }) => {
  const task = appData.tasks.find(t => t.id === tid)
  if (task) {
    task.name = name.trim()
    const valid = ['daily', 'weekly']
    task.periodicity = valid.includes(periodicity.toLowerCase()) ? periodicity.toLowerCase() : 'daily'
    task.state_count = state_count || 3
    task.profession_id = profession_id || null
    task.custom_image = custom_image !== undefined ? (custom_image || null) : task.custom_image
    task.track_profit = track_profit === true
    task.profit_display = (track_profit && task.periodicity === 'daily') ? (profit_display || 'both') : undefined
    saveData(appData)
  }
  return appData
})

ipcMain.handle('delete-task', (_, tid) => {
  appData.tasks = appData.tasks.filter(t => t.id !== tid)
  saveData(appData)
  return appData
})

ipcMain.handle('toggle-task', (_, { cid, tid }) => {
  const task = appData.tasks.find(t => t.id === tid)
  if (!task || !task.completion[cid]) return appData
  const compl = task.completion[cid]
  const states = task.state_count || 3
  const current = compl.status ?? 0
  compl.status = (current + 1) % states
  if (compl.status === states - 1) {
    const today = new Date().toISOString().slice(0, 10)
    compl.last_completed = today
    if (!compl.history.includes(today)) compl.history.push(today)
  }
  saveData(appData)
  return appData
})

ipcMain.handle('set-profit', (_, { cid, tid, date, amount }) => {
  const task = appData.tasks.find(t => t.id === tid)
  if (!task || !task.completion[cid]) return appData
  const compl = task.completion[cid]
  if (!compl.profit_log) compl.profit_log = {}
  if (amount === null || amount === undefined) {
    delete compl.profit_log[date]
  } else {
    const val = parseFloat(amount)
    if (!isNaN(val) && val >= 0) compl.profit_log[date] = val
  }
  saveData(appData)
  return appData
})

ipcMain.handle('reorder-characters', (_, orderedIds) => {
  const map = Object.fromEntries(appData.characters.map(c => [c.id, c]))
  appData.characters = orderedIds.map(id => map[id]).filter(Boolean)
  saveData(appData)
  return appData
})

ipcMain.handle('reorder-tasks', (_, orderedIds) => {
  const orderedIdSet = new Set(orderedIds)
  const map = Object.fromEntries(appData.tasks.map(t => [t.id, t]))
  // Find which positions in the full list belong to the tasks being reordered
  const positions = []
  appData.tasks.forEach((t, i) => { if (orderedIdSet.has(t.id)) positions.push(i) })
  // Place the re-ordered tasks back at those exact positions, leaving all other tasks untouched
  const newTasks = [...appData.tasks]
  const reordered = orderedIds.map(id => map[id]).filter(Boolean)
  positions.forEach((pos, i) => { newTasks[pos] = reordered[i] })
  appData.tasks = newTasks
  saveData(appData)
  return appData
})

ipcMain.handle('add-tab', (_, { name, color, icon_type, icon_value }) => {
  appData.tabs.push({ id: uuidv4(), name: name.trim(), color, icon_type: icon_type || 'letter', icon_value: icon_value || null })
  saveData(appData)
  return appData
})

ipcMain.handle('edit-tab', (_, { tabId, name, color, icon_type, icon_value }) => {
  const tab = appData.tabs.find(t => t.id === tabId)
  if (tab) { tab.name = name.trim(); tab.color = color; tab.icon_type = icon_type || 'letter'; tab.icon_value = icon_value || null; saveData(appData) }
  return appData
})

ipcMain.handle('delete-tab', (_, tabId) => {
  if (appData.tabs.length <= 1) return appData
  const fallbackId = appData.tabs.find(t => t.id !== tabId)?.id
  if (fallbackId) {
    for (const task of appData.tasks) { if (task.tab_id === tabId) task.tab_id = fallbackId }
  }
  appData.tabs = appData.tabs.filter(t => t.id !== tabId)
  saveData(appData)
  return appData
})

ipcMain.handle('reorder-tabs', (_, orderedIds) => {
  const map = Object.fromEntries(appData.tabs.map(t => [t.id, t]))
  appData.tabs = orderedIds.map(id => map[id]).filter(Boolean)
  saveData(appData)
  return appData
})

// ─── Update Checker ──────────────────────────────────────────────────────────
function fetchLatestRelease() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      method: 'GET',
      headers: { 'User-Agent': 'WoWToDo-Electron' }
    }
    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', chunk => { body += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(body)) } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')) })
    req.end()
  })
}

function parseVersion(v) {
  // Handles: "WowToDov1.6.0", "v1.6.0", "1.6.0", "1.6"
  return (v || '').replace(/^[^\d]*/, '').split('.').map(Number)
}

function isNewer(latest, current) {
  const a = parseVersion(latest)
  const b = parseVersion(current)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0, y = b[i] || 0
    if (x > y) return true
    if (x < y) return false
  }
  return false
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    let settled = false
    function done(err) {
      if (settled) return; settled = true
      if (err) { file.destroy(); try { fs.unlinkSync(dest) } catch {} reject(err) }
      else resolve()
    }
    function request(currentUrl) {
      const mod = currentUrl.startsWith('https') ? https : require('http')
      mod.get(currentUrl, { headers: { 'User-Agent': 'WoWToDo-Electron' } }, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          res.resume()
          request(res.headers.location)
          return
        }
        if (res.statusCode !== 200) { res.resume(); return done(new Error(`HTTP ${res.statusCode}`)) }
        const total = parseInt(res.headers['content-length'] || '0', 10)
        let received = 0
        res.on('data', chunk => {
          received += chunk.length
          if (total > 0) mainWindow?.webContents.send('update-progress', { status: 'downloading', percent: Math.round(received / total * 100) })
        })
        res.pipe(file)
        file.on('finish', () => file.close(done))
        file.on('error', done)
      }).on('error', done)
    }
    request(url)
  })
}

async function downloadAndReplace(url) {
  const exePath = process.env.PORTABLE_EXECUTABLE_FILE || app.getPath('exe')
  const exeDir  = path.dirname(exePath)
  const exeName = path.basename(exePath)
  const tempPath = path.join(exeDir, exeName + '.new')

  mainWindow?.webContents.send('update-progress', { status: 'downloading', percent: 0 })
  await downloadFile(url, tempPath)
  mainWindow?.webContents.send('update-progress', { status: 'ready' })

  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Actualización lista',
    message: 'La actualización se ha descargado.',
    detail: 'La aplicación se reiniciará para aplicar la actualización.',
    buttons: ['Reiniciar ahora', 'Más tarde'],
    defaultId: 0
  })

  if (response === 0) {
    const ps = [
      `Start-Sleep -Milliseconds 1500`,
      `Move-Item -Force '${tempPath.replace(/'/g, "''")}' '${exePath.replace(/'/g, "''")}'`,
      `Start-Process '${exePath.replace(/'/g, "''")}'`
    ].join('; ')
    spawn('powershell.exe', [
      '-WindowStyle', 'Hidden',
      '-NonInteractive',
      '-Command', ps
    ], { detached: true, stdio: 'ignore' }).unref()
    app.quit()
  } else {
    try { fs.unlinkSync(tempPath) } catch {}
  }
}

async function checkAndShowUpdate(silent = false) {
  try {
    const release   = await fetchLatestRelease()
    const latestTag = release.tag_name || ''
    const current   = app.getVersion()
    if (isNewer(latestTag, current)) {
      const asset = (release.assets || []).find(a => a.name.endsWith('.exe'))
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Nueva versión disponible',
        message: `Versión ${latestTag} disponible`,
        detail: `Tienes la versión ${current}. ¿Quieres descargar e instalar la actualización ahora?`,
        buttons: ['Descargar e instalar', 'Ahora no'],
        defaultId: 0
      })
      if (response === 0) {
        if (asset) await downloadAndReplace(asset.browser_download_url)
        else shell.openExternal(release.html_url)
      }
      return { hasUpdate: true, latest: latestTag, current }
    }
    return { hasUpdate: false, latest: latestTag, current }
  } catch (e) {
    return { hasUpdate: false, error: e.message }
  }
}

ipcMain.handle('get-app-version', () => app.getVersion())
ipcMain.handle('check-for-updates', () => checkAndShowUpdate(false))

// ─── Window Controls ────────────────────────────────────────────────────────
ipcMain.handle('win-minimize', () => { mainWindow?.minimize() })
ipcMain.handle('win-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.handle('win-close', () => { mainWindow?.close() })
ipcMain.handle('win-set-zoom', (_, factor) => {
  mainWindow?.webContents.setZoomFactor(factor)
})

ipcMain.handle('export-json', async () => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: 'wow_todo_export.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (filePath) {
    fs.writeFileSync(filePath, JSON.stringify(appData, null, 2), 'utf8')
    return { success: true }
  }
  return { success: false }
})

ipcMain.handle('import-json', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  })
  if (!filePaths || !filePaths[0]) return { success: false }
  try {
    const text = fs.readFileSync(filePaths[0], 'utf8')
    const newData = JSON.parse(text)
    if (!newData.characters) return { success: false, error: 'Invalid format' }
    appData = migrate(newData)
    saveData(appData)
    return { success: true, data: appData }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

// ─── Window ──────────────────────────────────────────────────────────────────

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 680,
    minWidth: 750,
    minHeight: 500,
    backgroundColor: '#111111',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#161616',
      symbolColor: '#ffffff',
      height: 36
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '..', 'public', 'icon.png')
  })

  Menu.setApplicationMenu(null)

  if (isDev) {
    mainWindow.loadURL('http://localhost:5271')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  mainWindow.webContents.once('did-finish-load', () => {
    setTimeout(() => checkAndShowUpdate(true), 3000)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
