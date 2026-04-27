const { Client, logger } = require('./lib/client')
const { DATABASE, VERSION } = require('./config')
const { stopInstance } = require('./lib/pm2')
const cron = require('node-cron') // ✅ TAMBAHAN

const start = async () => {
  logger.info(`levanter ${VERSION}`)

  try {
    await DATABASE.authenticate({ retry: { max: 3 } })
  } catch (error) {
    logger.error({
      msg: 'Database connection failed',
      error: error.message,
      url: process.env.DATABASE_URL,
    })
    return stopInstance()
  }

  const bot = new Client()

  try {
    await bot.connect()

    // =========================
    // 🚀 AUTO MESSAGE 3 HARI
    // =========================

    const target = '62895327354276@s.whatsapp.net'

    let startDate = new Date()

    function getDay() {
      const now = new Date()
      const diff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24))
      return diff + 1
    }

    const messages = {
      1: {
        morning: 'Good morning ☀️ semangat yaa 💛\n\nwaahaha kagett kan kamu 😆 ini otomatis loh wkwk, tapi aku tetep pengen nyapa kamu',
        night: 'Good night 🌙 jangan begadang ya 😴\n\nhari pertama nih… aku lagi ga ada tapi tetep kepikiran kamu 😆'
      },
      2: {
        morning: 'Morningg 🌸 jangan lupa sarapan yaa 🤍\n\nhari kedua… aku masih ga pegang hp, tapi aku harap kamu baik-baik aja ya',
        night: 'Good night 💙 tidur yang nyenyak yaa\n\njujur ya… aku kangen dikit sih 😶'
      },
      3: {
        morning: 'Good morning ☀️ semangat ya hari ini 💛\n\nhari terakhir nih… bentar lagi aku balik 😆',
        night: 'Good night 🌙 mimpi indah ya 😴\n\naku bikin ini biar kamu ga ngerasa sendirian… tunggu aku ya 💛'
      }
    }

    // PAGI
    cron.schedule('0 7 * * *', async () => {
      const day = getDay()
      if (day <= 3) {
        await bot.sendMessage(target, {
          text: messages[day].morning
        })
      }
    }, { timezone: "Asia/Jakarta" })

    // MALAM
    cron.schedule('0 22 * * *', async () => {
      const day = getDay()
      if (day <= 3) {
        await bot.sendMessage(target, {
          text: messages[day].night
        })
      }
    }, { timezone: "Asia/Jakarta" })

    logger.info('Auto message 3 hari aktif 🚀')

  } catch (error) {
    logger.error({ msg: 'Bot client failed to start', error: error.message })
  }

  return bot
}

const shutdown = async (bot) => {
  try {
    if (bot) await bot.close()
    await DATABASE.close()
    process.exit(0)
  } catch (error) {
    logger.error({ msg: 'Error during shutdown', error: error.message })
    process.exit(1)
  }
}

const init = async () => {
  const bot = await start()

  process.on('SIGINT', () => shutdown(bot))
  process.on('SIGTERM', () => shutdown(bot))
}

init()
