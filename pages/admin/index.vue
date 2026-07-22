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
// ... more aggregations will be added later when modules are ready
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Project Overview</h2>
      <button class="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition">
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
</template>
