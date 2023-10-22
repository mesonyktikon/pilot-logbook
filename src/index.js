import { readFileSync, readdirSync } from 'fs'
import chalk from 'chalk'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parseAllDocuments } from 'yaml'
import {AlignmentEnum, AsciiTable3} from 'ascii-table3'

const rootDirectory = dirname(dirname(fileURLToPath(import.meta.url)))

const dataDirectory = join(rootDirectory, 'data')
const ignoreSummingKeys = ['tail', 'type', 'srcFilename']

// an unfortunate reality of decimals in js is floating point arithmetic.
// to make the math play nice, i'm going to multiply all input data by 10
// since tenths of an hour are the smallest units used in the logbook.
// once the sums are computed, then we can divide by 10 to get the real results.
const sumTotals = entryList => {
  const sumsTimesTen = entryList.reduce((totals, entry) => {
    Object.entries(entry).forEach(([key, value]) => {
      if (typeof value !== 'number') {
        return
      }
      // sometimes... an all number tail number can sneak through...
      if (ignoreSummingKeys.includes(key)) {
        return
      }
      if (!totals[key]) {
        totals[key] = 0
      }
      totals[key] += Math.trunc(value * 10)
    })
    return totals
  }, {})
  return Object.entries(sumsTimesTen).reduce((sums, [key, totalTimesTen]) => {
    sums[key] = totalTimesTen / 10
    return sums
  }, {})
}

// LogbookEntry[]
// LogbookEntry is a line from the logbook
const logbookEntries = []
const pageTotals = []

const loadData = () => {
  const filenames = readdirSync(dataDirectory)
  filenames.forEach((filename) => {
    const contents = readFileSync(join(dataDirectory, filename), 'utf-8')
    const docs = parseAllDocuments(contents)
    docs.forEach((doc) => {
      const entry = doc.toJSON()
      if (entry.type === 'pageTotal') {
        entry.srcFilename = filename
        pageTotals.push(entry)
      } else {
        entry.srcFilename = filename
        // Some tidying up
        entry.tail = String(entry.tail).toUpperCase()
        entry.type = entry.type.toUpperCase()
        if (entry.from) {
          entry.from = entry.from.toUpperCase()
        }
        if (entry.to) {
          entry.to = entry.to.toUpperCase()
        }
        if (entry.stops) {
          entry.stops = entry.stops.toUpperCase().replace(/ /g, '')
        }
        logbookEntries.push(entry)
      }
    })
  })
}

const verifyData = () => {
  const pageEntries = {}

  logbookEntries.forEach((entry) => {
    const { srcFilename } = entry
    if (!pageEntries[srcFilename]) {
      pageEntries[srcFilename] = []
    }
    pageEntries[srcFilename].push(entry)
  })

  const numPageEntries = Object.keys(pageEntries).length
  if (numPageEntries === pageTotals.length - 1) {
    console.info('missing a page total')
  } else if (numPageEntries !== pageTotals.length) {
    throw new Error(`expected ${pageTotals.length} page totals but have ${numPageEntries}`)
  }

  pageTotals.forEach((pageTotal) => {
    let okay = true
    const { srcFilename } = pageTotal
    if (!pageEntries[srcFilename]) {
      throw new Error(`have page totals for ${srcFilename} but there are no entries`)
    }

    const computedTotal = sumTotals(pageEntries[srcFilename])
    const computedKeys = Object.keys(computedTotal)
    const expectedKeys = Object.keys(pageTotal).filter(key => !ignoreSummingKeys.includes(key))
    if (expectedKeys.length !== computedKeys.length) {
      console.error(`expected ${expectedKeys.length} keys but got ${computedKeys.length}`)
      console.log('expected keys', expectedKeys.sort(), 'computed keys', computedKeys.sort())
    }

    expectedKeys.forEach((expectedKey) => {
      const expected = pageTotal[expectedKey]
      const computed = computedTotal[expectedKey]
      if (expected !== computed) {
        console.error(`[${srcFilename}] [${expectedKey}] expected ${expected} computed ${computed}`)
        okay = false
      }
    })

    if (okay) {
      console.log(`[${srcFilename}] page totals OK`)
    }
  })
}

// [select the key from the entries, what to display it as]
// also respects order
const TABLE_HEADERS = {
  date: 'DATE',
  type: 'MODEL',
  tail: 'ID',
  from: 'FROM',
  to: 'TO',
  stops: 'STOPS',
  dayLandings: 'L-DY',
  nightLandings: 'L-NT',
  approaches: 'IAP',
  asel: 'ASEL',
  heli: 'HELI',
  imc: 'IMC',
  hood: 'HOOD',
  sim: 'SIM',
  night: 'NIGHT',
  xc: 'XC',
  pic: 'PIC',
  solo: 'SOLO',
  dualReceived: 'DUAL RCV',
  total: 'TOTAL',
}

const printTable = (entries, opts = {
  rowColors: [
    // filter func, which color to apply to the row
    [(entry) => !!entry.asel, chalk.green],
    [(entry) => !!entry.heli, chalk.blue.bold],
    [(entry) => !!entry.sim, chalk.red],
  ],
}) => {
  const table = new AsciiTable3('Logbook Entries')
  const headerKeys = Object.keys(TABLE_HEADERS)
  const headerTitles = Object.values(TABLE_HEADERS)

  table.setHeading(...headerTitles)
  table.setStyle('unicode-round')

  for (let i in headerTitles) {
    table.setAlign(Number(i), AlignmentEnum.CENTER)
  }

  const totals = sumTotals(entries)
  totals.date = 'SUM TOTAL'
  const data = [...entries, {}, totals]

  table.addRowMatrix(data.map((entry) => {
    // TODO some columns i'd like to have formatted to 1 decimal even for integer values e.g. '3.0' in lieu of '3'
    let rowValues = headerKeys.map((key) => entry[key] || '')

    opts.rowColors?.forEach(([filter, apply]) => {
      if (entry.date !== 'SUM TOTAL' && filter(entry)) {
        rowValues = rowValues.map(v => apply(v))
      }
    })
    return rowValues
}))

  console.log(table.toString())
}

// once data is verified, we can compute interesting things
const computeTotals = () => {
  const grandTotals = sumTotals(logbookEntries)
  console.table(grandTotals)
}

loadData()
verifyData()
// computeTotals()
printTable(logbookEntries)
