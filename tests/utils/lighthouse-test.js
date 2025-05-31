#!/usr/bin/env node

/**
 * Lighthouse Performance Testing Script
 * Tests Performance, Accessibility, Best Practices, and SEO
 */

const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')
const fs = require('fs')
const path = require('path')

// Configuration for different test scenarios
const TEST_CONFIG = {
  mobile: {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'mobile',
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        requestLatencyMs: 562.5,
        downloadThroughputKbps: 1638.4,
        uploadThroughputKbps: 675,
        cpuSlowdownMultiplier: 4
      },
      screenEmulation: {
        mobile: true,
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
      }
    }
  },
  desktop: {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'desktop',
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
        cpuSlowdownMultiplier: 1
      },
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
      }
    }
  }
}

// Pages to test
const TEST_PAGES = [
  {
    name: 'Home',
    url: '/',
    description: 'Landing page performance'
  },
  {
    name: 'Dashboard',
    url: '/dashboard',
    description: 'Main dashboard with room status and charts'
  },
  {
    name: 'New Booking',
    url: '/booking/new',
    description: 'Booking wizard performance'
  },
  {
    name: 'Calendar',
    url: '/calendar',
    description: 'Calendar view with 13 rooms'
  },
  {
    name: 'Settings',
    url: '/settings',
    description: 'Settings page with forms'
  }
]

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  performance: 90,
  accessibility: 95,
  'best-practices': 90,
  seo: 85,
  'first-contentful-paint': 2000,
  'largest-contentful-paint': 4000,
  'cumulative-layout-shift': 0.1,
  'speed-index': 4000
}

class LighthouseTest {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl
    this.results = []
  }

  async runTest(page, formFactor = 'mobile') {
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] })
    const config = TEST_CONFIG[formFactor]
    
    try {
      console.log(`🔍 Testing ${page.name} (${formFactor})...`)
      
      const result = await lighthouse(
        `${this.baseUrl}${page.url}`,
        {
          port: chrome.port,
          output: 'json'
        },
        config
      )
      
      await chrome.kill()
      
      return {
        page: page.name,
        formFactor,
        url: page.url,
        description: page.description,
        scores: this.extractScores(result.lhr),
        metrics: this.extractMetrics(result.lhr),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      await chrome.kill()
      throw error
    }
  }

  extractScores(report) {
    const categories = report.categories
    return {
      performance: Math.round(categories.performance.score * 100),
      accessibility: Math.round(categories.accessibility.score * 100),
      'best-practices': Math.round(categories['best-practices'].score * 100),
      seo: Math.round(categories.seo.score * 100)
    }
  }

  extractMetrics(report) {
    const audits = report.audits
    return {
      'first-contentful-paint': audits['first-contentful-paint'].numericValue,
      'largest-contentful-paint': audits['largest-contentful-paint'].numericValue,
      'cumulative-layout-shift': audits['cumulative-layout-shift'].numericValue,
      'speed-index': audits['speed-index'].numericValue,
      'time-to-interactive': audits['interactive'].numericValue,
      'total-blocking-time': audits['total-blocking-time'].numericValue
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Lighthouse Performance Tests\n')
    
    for (const page of TEST_PAGES) {
      try {
        // Test both mobile and desktop
        const mobileResult = await this.runTest(page, 'mobile')
        const desktopResult = await this.runTest(page, 'desktop')
        
        this.results.push(mobileResult, desktopResult)
        
        // Show immediate results
        this.displayResult(mobileResult)
        this.displayResult(desktopResult)
        
        console.log('') // Empty line for readability
        
      } catch (error) {
        console.error(`❌ Failed to test ${page.name}: ${error.message}`)
      }
    }
    
    this.generateReport()
    this.checkThresholds()
  }

  displayResult(result) {
    const { page, formFactor, scores, metrics } = result
    
    console.log(`📱 ${page} (${formFactor})`)
    console.log(`   Performance: ${this.getScoreIcon(scores.performance)} ${scores.performance}`)
    console.log(`   Accessibility: ${this.getScoreIcon(scores.accessibility)} ${scores.accessibility}`)
    console.log(`   Best Practices: ${this.getScoreIcon(scores['best-practices'])} ${scores['best-practices']}`)
    console.log(`   SEO: ${this.getScoreIcon(scores.seo)} ${scores.seo}`)
    console.log(`   FCP: ${Math.round(metrics['first-contentful-paint'])}ms`)
    console.log(`   LCP: ${Math.round(metrics['largest-contentful-paint'])}ms`)
    console.log(`   CLS: ${metrics['cumulative-layout-shift'].toFixed(3)}`)
  }

  getScoreIcon(score) {
    if (score >= 90) return '✅'
    if (score >= 70) return '⚠️'
    return '❌'
  }

  generateReport() {
    const report = {
      summary: this.generateSummary(),
      results: this.results,
      timestamp: new Date().toISOString(),
      thresholds: PERFORMANCE_THRESHOLDS
    }
    
    // Save detailed JSON report
    const reportsDir = path.join(__dirname, '..', '..', 'reports')
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true })
    }
    
    const reportPath = path.join(reportsDir, `lighthouse-${Date.now()}.json`)
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`📊 Detailed report saved to: ${reportPath}`)
    
    // Generate HTML report
    this.generateHTMLReport(report, reportsDir)
  }

  generateSummary() {
    const mobileResults = this.results.filter(r => r.formFactor === 'mobile')
    const desktopResults = this.results.filter(r => r.formFactor === 'desktop')
    
    const calculateAverage = (results, metric) => {
      const sum = results.reduce((acc, r) => acc + r.scores[metric], 0)
      return Math.round(sum / results.length)
    }
    
    return {
      mobile: {
        averagePerformance: calculateAverage(mobileResults, 'performance'),
        averageAccessibility: calculateAverage(mobileResults, 'accessibility'),
        averageBestPractices: calculateAverage(mobileResults, 'best-practices'),
        averageSEO: calculateAverage(mobileResults, 'seo')
      },
      desktop: {
        averagePerformance: calculateAverage(desktopResults, 'performance'),
        averageAccessibility: calculateAverage(desktopResults, 'accessibility'),
        averageBestPractices: calculateAverage(desktopResults, 'best-practices'),
        averageSEO: calculateAverage(desktopResults, 'seo')
      }
    }
  }

  generateHTMLReport(report, reportsDir) {
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ReBASE 369 - Lighthouse Performance Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .results { display: grid; gap: 20px; }
        .result-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .score { display: inline-block; width: 40px; height: 40px; border-radius: 50%; text-align: center; line-height: 40px; color: white; font-weight: bold; }
        .score.good { background: #059669; }
        .score.okay { background: #d97706; }
        .score.poor { background: #dc2626; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 15px; }
        .metric { text-align: center; padding: 10px; background: #f3f4f6; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 ReBASE 369 Performance Report</h1>
        <p>Generated: ${new Date(report.timestamp).toLocaleString('ja-JP')}</p>
    </div>
    
    <div class="summary">
        <div class="summary-card">
            <h2>📱 Mobile Average</h2>
            <p>Performance: ${report.summary.mobile.averagePerformance}</p>
            <p>Accessibility: ${report.summary.mobile.averageAccessibility}</p>
            <p>Best Practices: ${report.summary.mobile.averageBestPractices}</p>
            <p>SEO: ${report.summary.mobile.averageSEO}</p>
        </div>
        <div class="summary-card">
            <h2>💻 Desktop Average</h2>
            <p>Performance: ${report.summary.desktop.averagePerformance}</p>
            <p>Accessibility: ${report.summary.desktop.averageAccessibility}</p>
            <p>Best Practices: ${report.summary.desktop.averageBestPractices}</p>
            <p>SEO: ${report.summary.desktop.averageSEO}</p>
        </div>
    </div>
    
    <div class="results">
        ${report.results.map(result => `
            <div class="result-card">
                <h3>${result.page} (${result.formFactor})</h3>
                <p>${result.description}</p>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span class="score ${this.getScoreClass(result.scores.performance)}">${result.scores.performance}</span>
                    <span class="score ${this.getScoreClass(result.scores.accessibility)}">${result.scores.accessibility}</span>
                    <span class="score ${this.getScoreClass(result.scores['best-practices'])}">${result.scores['best-practices']}</span>
                    <span class="score ${this.getScoreClass(result.scores.seo)}">${result.scores.seo}</span>
                </div>
                <div class="metrics">
                    <div class="metric">
                        <div>FCP</div>
                        <div>${Math.round(result.metrics['first-contentful-paint'])}ms</div>
                    </div>
                    <div class="metric">
                        <div>LCP</div>
                        <div>${Math.round(result.metrics['largest-contentful-paint'])}ms</div>
                    </div>
                    <div class="metric">
                        <div>CLS</div>
                        <div>${result.metrics['cumulative-layout-shift'].toFixed(3)}</div>
                    </div>
                    <div class="metric">
                        <div>SI</div>
                        <div>${Math.round(result.metrics['speed-index'])}ms</div>
                    </div>
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`
    
    const htmlPath = path.join(reportsDir, `lighthouse-report-${Date.now()}.html`)
    fs.writeFileSync(htmlPath, html)
    console.log(`📄 HTML report saved to: ${htmlPath}`)
  }

  getScoreClass(score) {
    if (score >= 90) return 'good'
    if (score >= 70) return 'okay'
    return 'poor'
  }

  checkThresholds() {
    console.log('\n🎯 Threshold Analysis:')
    
    const failures = []
    
    this.results.forEach(result => {
      Object.entries(PERFORMANCE_THRESHOLDS).forEach(([metric, threshold]) => {
        let value
        if (result.scores[metric] !== undefined) {
          value = result.scores[metric]
        } else if (result.metrics[metric] !== undefined) {
          value = result.metrics[metric]
        } else {
          return
        }
        
        const passes = metric === 'cumulative-layout-shift' 
          ? value <= threshold 
          : metric.includes('paint') || metric.includes('index') || metric.includes('time') || metric.includes('blocking')
          ? value <= threshold
          : value >= threshold
        
        if (!passes) {
          failures.push({
            page: result.page,
            formFactor: result.formFactor,
            metric,
            value,
            threshold,
            difference: metric === 'cumulative-layout-shift' || 
                       metric.includes('paint') || 
                       metric.includes('index') || 
                       metric.includes('time') || 
                       metric.includes('blocking')
              ? value - threshold 
              : threshold - value
          })
        }
      })
    })
    
    if (failures.length === 0) {
      console.log('✅ All pages meet performance thresholds!')
    } else {
      console.log(`❌ ${failures.length} threshold failures found:`)
      failures.forEach(failure => {
        console.log(`   ${failure.page} (${failure.formFactor}): ${failure.metric} = ${failure.value} (threshold: ${failure.threshold})`)
      })
    }
    
    return failures.length === 0
  }
}

// Run tests if called directly
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000'
  const tester = new LighthouseTest(baseUrl)
  
  tester.runAllTests()
    .then(() => {
      console.log('\n🎉 Lighthouse testing complete!')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Lighthouse testing failed:', error)
      process.exit(1)
    })
}

module.exports = LighthouseTest