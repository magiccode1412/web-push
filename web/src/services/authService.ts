const TOKEN_KEY = 'admin_token'

export const authService = {
  async login(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem(TOKEN_KEY, data.token)
        return { success: true, token: data.token }
      } else {
        return { success: false, error: data.error || '登录失败' }
      }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, error: '网络错误' }
    }
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY)
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  isAuthenticated(): boolean {
    return !!this.getToken()
  },

  async getCurrentUser(): Promise<{ success: boolean; user?: any; error?: string }> {
    const token = this.getToken()
    if (!token) {
      return { success: false, error: '未登录' }
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (data.success) {
        return { success: true, user: data.user }
      } else {
        this.logout()
        return { success: false, error: data.error || '获取用户信息失败' }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return { success: false, error: '网络错误' }
    }
  }
}
