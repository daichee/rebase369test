"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/components/auth/auth-provider"

interface SecurityEvent {
  type: 'multiple_login_attempts' | 'suspicious_activity' | 'session_hijack_attempt'
  timestamp: number
  details: any
}

export function useSecurityMonitoring() {
  const { user, signOut } = useAuth()
  const loginAttempts = useRef<number[]>([])
  const lastKnownIP = useRef<string | null>(null)
  const suspiciousActivityCount = useRef<number>(0)

  useEffect(() => {
    if (!user) return

    // Monitor for suspicious login patterns
    const monitorLoginAttempts = () => {
      const now = Date.now()
      const recentAttempts = loginAttempts.current.filter(
        timestamp => now - timestamp < 5 * 60 * 1000 // Last 5 minutes
      )
      
      if (recentAttempts.length > 5) {
        logSecurityEvent({
          type: 'multiple_login_attempts',
          timestamp: now,
          details: { attemptCount: recentAttempts.length }
        })
        
        // Optionally force logout for security
        // signOut()
        // alert("複数回の不正なログイン試行が検出されました。セキュリティのためログアウトします。")
      }
    }

    // Monitor for session hijacking attempts
    const monitorSessionIntegrity = async () => {
      try {
        // Check if user agent or other browser fingerprints have changed suspiciously
        const currentUserAgent = navigator.userAgent
        const storedUserAgent = localStorage.getItem('user_agent')
        
        if (storedUserAgent && storedUserAgent !== currentUserAgent) {
          logSecurityEvent({
            type: 'session_hijack_attempt',
            timestamp: Date.now(),
            details: { 
              storedUserAgent,
              currentUserAgent 
            }
          })
          
          // Force logout on potential session hijacking
          signOut()
          alert("セッションの異常が検出されました。セキュリティのためログアウトします。")
          return
        }
        
        // Store current user agent
        localStorage.setItem('user_agent', currentUserAgent)
        
      } catch (error) {
        console.error("Session integrity check failed:", error)
      }
    }

    // Monitor for suspicious activity patterns
    const monitorSuspiciousActivity = () => {
      // Track rapid page navigation, excessive API calls, etc.
      const handleSuspiciousActivity = () => {
        suspiciousActivityCount.current++
        
        if (suspiciousActivityCount.current > 50) { // Threshold for suspicious activity
          logSecurityEvent({
            type: 'suspicious_activity',
            timestamp: Date.now(),
            details: { activityCount: suspiciousActivityCount.current }
          })
          
          // Reset counter
          suspiciousActivityCount.current = 0
        }
      }

      // Monitor excessive clicking/activity
      let activityCount = 0
      const resetActivityCount = () => {
        activityCount = 0
      }
      
      const trackActivity = () => {
        activityCount++
        if (activityCount > 100) { // 100 actions per minute threshold
          handleSuspiciousActivity()
          activityCount = 0
        }
      }

      document.addEventListener('click', trackActivity)
      document.addEventListener('keydown', trackActivity)
      
      const activityResetInterval = setInterval(resetActivityCount, 60 * 1000) // Reset every minute

      return () => {
        document.removeEventListener('click', trackActivity)
        document.removeEventListener('keydown', trackActivity)
        clearInterval(activityResetInterval)
      }
    }

    // Run security monitoring
    monitorLoginAttempts()
    monitorSessionIntegrity()
    const cleanupSuspiciousActivity = monitorSuspiciousActivity()

    // Set up intervals for periodic checks
    const loginMonitorInterval = setInterval(monitorLoginAttempts, 60 * 1000) // Every minute
    const sessionMonitorInterval = setInterval(monitorSessionIntegrity, 5 * 60 * 1000) // Every 5 minutes

    return () => {
      clearInterval(loginMonitorInterval)
      clearInterval(sessionMonitorInterval)
      cleanupSuspiciousActivity()
    }
  }, [user, signOut])

  // Log security events (in production, this would send to a security service)
  const logSecurityEvent = (event: SecurityEvent) => {
    console.warn("Security Event Detected:", event)
    
    // In production, you would send this to your security monitoring service
    // Example:
    // fetch('/api/security/log', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // })
    
    // Store locally for now
    const securityLogs = JSON.parse(localStorage.getItem('security_logs') || '[]')
    securityLogs.push(event)
    
    // Keep only last 100 events
    if (securityLogs.length > 100) {
      securityLogs.shift()
    }
    
    localStorage.setItem('security_logs', JSON.stringify(securityLogs))
  }

  // Track login attempt
  const trackLoginAttempt = () => {
    loginAttempts.current.push(Date.now())
    
    // Keep only last 10 attempts
    if (loginAttempts.current.length > 10) {
      loginAttempts.current.shift()
    }
  }

  return {
    trackLoginAttempt,
    logSecurityEvent
  }
}