<script setup>
definePageMeta({
  layout: 'admin'
})

const client = useSupabaseClient()
const users = ref([])
const loading = ref(true)

const showModal = ref(false)
const newUser = reactive({
  email: '',
  password: '',
  username: '',
  role: 'user'
})

const fetchUsers = async () => {
  loading.value = true
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .neq('role', 'super_admin')
  if (error) console.error('[fetchUsers] error:', error)
  else {
    console.log('[fetchUsers] data:', data)
    users.value = data
  }
  loading.value = false
}

const createUser = async () => {
  try {
    await $fetch('/api/create-user', {
      method: 'POST',
      body: {
        email: newUser.email,
        password: newUser.password,
        username: newUser.username,
        role: newUser.role
      }
    })

    alert('User created successfully!')
    showModal.value = false
    newUser.email = ''
    newUser.password = ''
    newUser.username = ''
    newUser.role = 'user'
    fetchUsers()
  } catch (err) {
    alert(err?.data?.message ?? err?.message)
  }
}

onMounted(fetchUsers)
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Manage Accounts</h2>
      <button @click="showModal = true" class="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition">
        + Create Account
      </button>
    </div>

    <div class="bg-white shadow-sm rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="user in users" :key="user.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.username }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{{ user.role }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ new Date(user.created_at).toLocaleDateString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button class="text-yellow-600 hover:text-yellow-900 mr-4">Edit</button>
              <button class="text-red-600 hover:text-red-900">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create User Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-bold mb-4">Create New Account</h3>
        <form @submit.prevent="createUser" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Username</label>
            <input v-model="newUser.username" type="text" required class="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input v-model="newUser.email" type="email" required class="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Password</label>
            <input v-model="newUser.password" type="password" required class="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Role</label>
            <select v-model="newUser.role" class="mt-1 block w-full border rounded p-2">
              <option value="user">User</option>
              <option value="visitor">Visitor</option>
            </select>
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button @click="showModal = false" type="button" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">Create</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
