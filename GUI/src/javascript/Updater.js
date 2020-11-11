const assert = require('assert')
const isURL = require('is-url')
const isDev = require('electron-is-dev')
const ms = require('ms')

const LicenseChecker = require('./license');

// TODO: Add support for linux
const supportedPlatforms = ['darwin', 'win32']

module.exports = function updater(opts = {}) {
    // check for bad input early, so it will be logged during development
    opts = validateInput(opts)

    // don't attempt to update during development
    if (isDev) {
        const message = 'App update config looks good; aborting updates since app is in development mode'
        opts.logger ? opts.logger.log(message) : console.log(message)
        return
    }

    opts.electron.app.isReady()
        ? initUpdater(opts)
        : opts.electron.app.on('ready', () => initUpdater(opts))
}

function initUpdater(opts) {
    const { host, updateInterval, logger, electron } = opts
    const { autoUpdater, dialog } = electron
    // For darwin FC-Taylor.json should contain the url to the new zip of the app, e.g., { url: `${host}/${UpdateZipFilename}` };
    // For windows "host" should contain the url to a folder containing the RELEASES and the .nupkg files
    const feedURL = process.platform === 'win32' ? `${host}` : `${host}/FC-Taylor.json`
    //   const requestHeaders = { 'User-Agent': userAgent }

    function log(...args) {
        logger.log(...args)
    }

    // exit early on unsupported platforms, e.g. `linux`
    if (typeof process !== 'undefined' && process.platform && !supportedPlatforms.includes(process.platform)) {
        log(`Electron's autoUpdater does not support the '${process.platform}' platform`)
        LicenseChecker.CheckVersion(false);
        return
    }

    log('feedURL', feedURL)
    //   log('requestHeaders', requestHeaders)
    //   autoUpdater.setFeedURL(feedURL, requestHeaders)
    autoUpdater.setFeedURL(feedURL)

    autoUpdater.on('error', err => {
        log('updater error')
        log(err)
    })

    autoUpdater.on('checking-for-update', () => {
        log('checking-for-update')
    })

    autoUpdater.on('update-available', () => {
        log('update-available; downloading...')
    })

    autoUpdater.on('update-not-available', () => {
        log('update-not-available')
    })

    if (opts.notifyUser) {
        autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, releaseDate, updateURL) => {
            log('update-downloaded', [event, releaseNotes, releaseName, releaseDate, updateURL])

            const dialogOpts = {
                type: 'info',
                buttons: ['Restart', 'Later'],
                title: 'Application Update',
                message: releaseName,
                detail: 'A new version has been downloaded. Restart the application to apply the updates.'
            }

            dialog.showMessageBox(dialogOpts).then(({ response }) => {
                if (response === 0) autoUpdater.quitAndInstall()
            })
        })
    }

    // check for updates right away and keep checking later
    autoUpdater.checkForUpdates()
    setInterval(() => { autoUpdater.checkForUpdates() }, ms(updateInterval))
}

function validateInput(opts) {
    const defaults = {
        host: 'http://folk.ntnu.no/frodal/Cite/Projects',
        updateInterval: '10 minutes',
        logger: console,
        notifyUser: true
    }
    const { host, updateInterval, logger, notifyUser } = Object.assign({}, defaults, opts)

    // allows electron to be mocked in tests
    const electron = opts.electron || require('electron')

    assert(
        isURL(host) && host.startsWith('http'),
        'host must be a valid HTTP or HTTPS URL'
    )

    assert(
        typeof updateInterval === 'string' && updateInterval.match(/^\d+/),
        'updateInterval must be a human-friendly string interval like `20 minutes`'
    )

    assert(
        ms(updateInterval) >= 5 * 60 * 1000,
        'updateInterval must be `5 minutes` or more'
    )

    assert(
        logger && typeof logger.log,
        'function'
    )

    return { host, updateInterval, logger, electron, notifyUser }
}
