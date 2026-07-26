<script setup>
const { login, profile } = useAuth()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    await login(email.value, password.value)
    if (profile.value?.role === 'super_admin') await navigateTo('/admin')
    else if (profile.value?.role === 'user') await navigateTo('/user/dashboard')
    else if (profile.value?.role === 'visitor') await navigateTo('/visitor')
    else errorMsg.value = 'Account not found or not set up. Please contact your administrator.'
  } catch (err) {
    errorMsg.value = err.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Zam Zam Gold Mine</h1>
        <p class="text-gray-600 mt-2">Management System</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700">Email / Username</label>
          <input
            v-model="email"
            type="text"
            required
            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500"
            placeholder="admin@example.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Password</label>
          <input
            v-model="password"
            type="password"
            required
            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500"
            placeholder="••••••••"
          />
        </div>

        <div v-if="errorMsg" class="text-red-600 text-sm">
          {{ errorMsg }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
        >
          {{ loading ? 'Logging in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>
