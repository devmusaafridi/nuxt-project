<script setup>
definePageMeta({
  layout: 'admin'
})

const users = ref([])
const loading = ref(true)

// ── Create ──────────────────────────────────────────────
const showCreateModal = ref(false)
const newUser = reactive({ email: '', password: '', username: '', role: 'user' })
const creating = ref(false)

// ── Edit ────────────────────────────────────────────────
const showEditModal = ref(false)
const editUser = reactive({ id: '', username: '', role: '', password: '' })
const saving = ref(false)

// ── Delete ──────────────────────────────────────────────
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

// ── Fetch ────────────────────────────────────────────────
const fetchUsers = async () => {
  loading.value = true
  try {
    users.value = await $fetch('/api/users')
  } catch (err) {
    console.error('[fetchUsers] error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)

// ── Create handler ───────────────────────────────────────
const createUser = async () => {
  creating.value = true
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
    showCreateModal.value = false
    newUser.email = ''
    newUser.password = ''
    newUser.username = ''
    newUser.role = 'user'
    await fetchUsers()
  } catch (err) {
    alert(err?.data?.message ?? err?.message)
  } finally {
    creating.value = false
  }
}

// ── Edit handlers ────────────────────────────────────────
const openEdit = (user) => {
  editUser.id = user.id
  editUser.username = user.username
  editUser.role = user.role
  editUser.password = ''
  showEditModal.value = true
}

const saveEdit = async () => {
  saving.value = true
  try {
    await $fetch(`/api/user/${editUser.id}`, {
      method: 'PATCH',
      body: {
        username: editUser.username,
        role: editUser.role,
        ...(editUser.password ? { password: editUser.password } : {})
      }
    })
    showEditModal.value = false
    await fetchUsers()
  } catch (err) {
    alert(err?.data?.message ?? err?.message)
  } finally {
    saving.value = false
  }
}

// ── Delete handlers ──────────────────────────────────────
const openDelete = (user) => {
  deleteTarget.value = user
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    await $fetch(`/api/user/${deleteTarget.value.id}`, { method: 'DELETE' })
    showDeleteModal.value = false
    deleteTarget.value = null
    await fetchUsers()
  } catch (err) {
    alert(err?.data?.message ?? err?.message)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Manage Accounts</h2>
      <button @click="showCreateModal = true" class="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition">
        + Create Account
      </button>
    </div>

    <div class="bg-white shadow-sm rounded-lg overflow-hidden">
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600"></div>
      </div>
      <table v-else class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="users.length === 0">
            <td colspan="5" class="px-6 py-8 text-center text-sm text-gray-400">No accounts found.</td>
          </tr>
          <tr v-for="user in users" :key="user.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.username }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ user.email }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{{ user.role }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ new Date(user.created_at).toLocaleDateString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button @click="openEdit(user)" class="text-yellow-600 hover:text-yellow-900 mr-4">Edit</button>
              <button @click="openDelete(user)" class="text-red-600 hover:text-red-900">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
            <button @click="showCreateModal = false" type="button" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
            <button type="submit" :disabled="creating" class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50">
              {{ creating ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-bold mb-4">Edit Account</h3>
        <form @submit.prevent="saveEdit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Username</label>
            <input v-model="editUser.username" type="text" required class="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Role</label>
            <select v-model="editUser.role" class="mt-1 block w-full border rounded p-2">
              <option value="user">User</option>
              <option value="visitor">Visitor</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">New Password <span class="text-gray-400 font-normal">(leave blank to keep current)</span></label>
            <input v-model="editUser.password" type="password" class="mt-1 block w-full border rounded p-2" placeholder="••••••••" />
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button @click="showEditModal = false" type="button" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
            <button type="submit" :disabled="saving" class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 class="text-lg font-bold mb-2">Delete Account</h3>
        <p class="text-sm text-gray-600 mb-6">
          Are you sure you want to delete <span class="font-semibold text-gray-800">{{ deleteTarget?.username }}</span>?
          This action cannot be undone.
        </p>
        <div class="flex justify-end space-x-3">
          <button @click="showDeleteModal = false" type="button" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
          <button @click="confirmDelete" :disabled="deleting" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
