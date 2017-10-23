#!/bin/sh
':' //# http://sambal.org/?p=1014 ; exec /usr/bin/env node "$0" "$@"
"use strict";

console.log('Hello world!')

const git_rev_sync = require('git-rev-sync')
const Raven = require('raven')

/////////////////////

Raven
	.config('https://7859d53f625a4b86ae24de47c1c8dd37:ffece04732cb45f4a14876cd6f82ec1b@sentry.io/233825', {
		release: git_rev_sync.long(),
	})
	.install(() => {/* disable Sentry unreliable fatal handler */})

const SHUTDOWN_DELAY_MS = 1000
let closing = false
function on_fatal(err) {
	if (closing) return
	console.error('🔥  FATAL on', err, 'initiating shutdown...')

	setTimeout(() => {
		console.log('⚰ RIP');
		process.exit(1)
	}, SHUTDOWN_DELAY_MS)
	closing = true
}

process.on('uncaughtException', (err) => {
	console.error(`🔥  Uncaught exception!`, err)
	Raven.captureException(err, sendErr => { // This callback fires once the report has been sent to Sentry
		if (sendErr)
			console.error('🔥  Failed to send captured exception to Sentry!')
		else
			console.log('⚡  Captured exception and sent it to Sentry successfully')
	})
	on_fatal(err)
})

process.on('unhandledRejection', (reason, p) => {
	console.error('🔥  Unhandled Rejection, reason:', reason)
	Raven.captureException(reason, sendErr => { // This callback fires once the report has been sent to Sentry
		if (sendErr)
			console.error('🔥  Failed to send captured rejection reason to Sentry!')
		else
			console.log('⚡  Captured rejection reason and sent it to Sentry successfully')
	})
	on_fatal(reason)
})

/////////////////////

//Raven.context(function () {
	setTimeout(() => {
		throw '[thrown string]' // 🤕 not throwing a proper error!
	})

	setTimeout(() => {
		throw new Error('[thrown error]')
	})

	new Promise((resolve, reject) => {
		setTimeout(() => reject('[rejected string]')) // 🤕 not rejecting with a proper error!
	})

	new Promise((resolve, reject) => {
		setTimeout(() => reject(new Error('[rejected error]')))
	})
//})
