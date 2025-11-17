import log from "electron-log"
import { app } from "electron"

const isDev = !app.isPackaged

// Configure global settings
log.transports.file.level = isDev ? "info" : "warn"
log.transports.log.level = isDev ? "debug" : "error"
log.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}] [{level}] {text}"
log.transports.file.maxSize = 5 * 1024 * 1024

export default log
