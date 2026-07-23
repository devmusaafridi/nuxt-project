<script setup>
definePageMeta({
  layout: 'admin'
})

const client = useSupabaseClient()
const projects = ref([])
const loading = ref(true)

const fetchProjects = async () => {
  loading.value = true
  const { data, error } = await client
    .from('projects')
    .select(`
      *,
      assigned_user:profiles(username)
    `)
  if (error) console.error(error)
  else projects.value = data
  loading.value = false
}

onMounted(fetchProjects)

// Overall Summary (calculated from projects)
const totalCapital = computed(() => projects.value.reduce((sum, p) => sum + (p.capital_allocated || 0), 0))

// Create Project
const showModal = ref(false)
const users = ref([])
const newProject = reactive({ name: '', capital_allocated: '', assigned_user: '' })
const creating = ref(false)

const fetchUsers = async () => {
  const { data, error } = await client
    .from('profiles')
    .select('id, username')
    .eq('role', 'user')
  if (!error) users.value = data
}

const openModal = async () => {
  await fetchUsers()
  showModal.value = true
}

const createProject = async () => {
  creating.value = true
  try {
    const payload = {
      name: newProject.name,
      capital_allocated: Number(newProject.capital_allocated),
      ...(newProject.assigned_user ? { assigned_user: newProject.assigned_user } : {})
    }
    const { error } = await client.from('projects').insert(payload)
    if (error) throw error
    showModal.value = false
    newProject.name = ''
    newProject.capital_allocated = ''
    newProject.assigned_user = ''
    await fetchProjects()
  } catch (err) {
    alert(err.message)
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Project Overview</h2>
      <button @click="openModal" class="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition">
        + New Project
      </button>
    </div>

    <!-- Overall Summary Cards -->
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

    <!-- Project List -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="project in projects" :key="project.id" class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
        <div class="p-5">
          <h3 class="text-xl font-bold text-gray-800 mb-2">{{ project.name }}</h3>
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

  <!-- Create Project Modal -->
  <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
          <button @click="showModal = false" type="button" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
          <button type="submit" :disabled="creating" class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50">
            {{ creating ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
