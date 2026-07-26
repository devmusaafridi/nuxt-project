<script setup>
definePageMeta({
  layout: 'admin'
})

const projects = ref([])
const loading = ref(true)
const users = ref([])

const totalCapital = computed(() => projects.value.reduce((sum, p) => sum + (p.capital_allocated || 0), 0))

// ── Fetch ─────────────────────────────────────────────────
const fetchProjects = async () => {
  loading.value = true
  try {
    projects.value = await $fetch('/api/projects')
  } catch (err) {
    console.error('[fetchProjects] error:', err)
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  try {
    const data = await $fetch('/api/users')
    users.value = data.filter(u => u.role === 'user')
  } catch (err) {
    console.error('[fetchUsers] error:', err)
  }
}

onMounted(fetchProjects)

// ── Create ────────────────────────────────────────────────
const showCreateModal = ref(false)
const newProject = reactive({ name: '', capital_allocated: '', assigned_user: '' })
const creating = ref(false)

const openCreateModal = async () => {
  await fetchUsers()
  showCreateModal.value = true
}

const createProject = async () => {
  creating.value = true
  try {
    await $fetch('/api/projects', {
      method: 'POST',
      body: {
        name: newProject.name,
        capital_allocated: newProject.capital_allocated,
        assigned_user: newProject.assigned_user || null
      }
    })
    showCreateModal.value = false
    newProject.name = ''
    newProject.capital_allocated = ''
    newProject.assigned_user = ''
    await fetchProjects()
  } catch (err) {
    alert(err?.data?.message ?? err?.message)
  } finally {
    creating.value = false
  }
}

// ── Edit ──────────────────────────────────────────────────
const showEditModal = ref(false)
const editProject = reactive({ id: '', name: '', capital_allocated: '', assigned_user: '' })
const saving = ref(false)

const openEdit = async (project) => {
  await fetchUsers()
  editProject.id = project.id
  editProject.name = project.name
  editProject.capital_allocated = project.capital_allocated
  editProject.assigned_user = project.assigned_user?.id || ''
  showEditModal.value = true
}

const saveEdit = async () => {
  saving.value = true
  try {
    await $fetch(`/api/project/${editProject.id}`, {
      method: 'PATCH',
      body: {
        name: editProject.name,
        capital_allocated: editProject.capital_allocated,
        assigned_user: editProject.assigned_user || null
      }
    })
    showEditModal.value = false
    await fetchProjects()
  } catch (err) {
    alert(err?.data?.message ?? err?.message)
  } finally {
    saving.value = false
  }
}

// ── Delete ────────────────────────────────────────────────
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

const openDelete = (project) => {
  deleteTarget.value = project
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    await $fetch(`/api/project/${deleteTarget.value.id}`, { method: 'DELETE' })
    showDeleteModal.value = false
    deleteTarget.value = null
    await fetchProjects()
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
      <h2 class="text-2xl font-bold text-gray-800">Project Overview</h2>
      <button @click="openCreateModal" class="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition">
        + New Project
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
        <p class="text-sm text-gray-500 uppercase font-bold">Total Capital</p>
        <p class="text-2xl font-bold text-gray-800">Rs. {{ totalCapital.toLocaleString() }}</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
        <p class="text-sm text-gray-500 uppercase font-bold">Overall Gold</p>
        <p class="text-2xl font-bold text-gray-800">0 g</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
        <p class="text-sm text-gray-500 uppercase font-bold">Total Expenses</p>
        <p class="text-2xl font-bold text-gray-800">Rs. 0</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
        <p class="text-sm text-gray-500 uppercase font-bold">Remaining Balance</p>
        <p class="text-2xl font-bold text-gray-800">Rs. {{ totalCapital.toLocaleString() }}</p>
      </div>
    </div>

    <!-- Project Cards -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
    </div>
    <div v-else-if="projects.length === 0" class="flex flex-col items-center justify-center py-20 text-gray-400">
      <div class="text-5xl mb-4">📋</div>
      <p class="text-lg font-medium">No projects yet.</p>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="project in projects" :key="project.id" class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
        <div class="p-5">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-xl font-bold text-gray-800">{{ project.name }}</h3>
            <div class="flex space-x-2 ml-2 flex-shrink-0">
              <button @click="openEdit(project)" class="text-xs text-yellow-600 hover:text-yellow-800 font-medium">Edit</button>
              <button @click="openDelete(project)" class="text-xs text-red-600 hover:text-red-800 font-medium">Delete</button>
            </div>
          </div>
          <p class="text-sm text-gray-600 mb-4">Assigned: <span class="font-medium">{{ project.assigned_user?.username || 'Unassigned' }}</span></p>

          <div class="space-y-2 mb-4">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Capital:</span>
              <span class="font-bold">Rs. {{ project.capital_allocated?.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Balance:</span>
              <span class="font-bold text-green-600">Rs. {{ project.capital_allocated?.toLocaleString() }}</span>
            </div>
          </div>

          <NuxtLink
            :to="`/admin/projects/${project.id}`"
            class="block text-center bg-gray-100 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
          >
            View Dashboard
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>

  <!-- Create Modal -->
  <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full">
      <h3 class="text-lg font-bold mb-4">Create New Project</h3>
      <form @submit.prevent="createProject" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Project Name</label>
          <input v-model="newProject.name" type="text" required class="mt-1 block w-full border rounded p-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Capital Allocated (Rs.)</label>
          <input v-model="newProject.capital_allocated" type="number" min="0" required class="mt-1 block w-full border rounded p-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Assign User</label>
          <select v-model="newProject.assigned_user" class="mt-1 block w-full border rounded p-2">
            <option value="">— Unassigned —</option>
            <option v-for="u in users" :key="u.id" :value="u.id">{{ u.username }}</option>
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
      <h3 class="text-lg font-bold mb-4">Edit Project</h3>
      <form @submit.prevent="saveEdit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Project Name</label>
          <input v-model="editProject.name" type="text" required class="mt-1 block w-full border rounded p-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Capital Allocated (Rs.)</label>
          <input v-model="editProject.capital_allocated" type="number" min="0" required class="mt-1 block w-full border rounded p-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Assign User</label>
          <select v-model="editProject.assigned_user" class="mt-1 block w-full border rounded p-2">
            <option value="">— Unassigned —</option>
            <option v-for="u in users" :key="u.id" :value="u.id">{{ u.username }}</option>
          </select>
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
      <h3 class="text-lg font-bold mb-2">Delete Project</h3>
      <p class="text-sm text-gray-600 mb-6">
        Are you sure you want to delete <span class="font-semibold text-gray-800">{{ deleteTarget?.name }}</span>?
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
</template>
