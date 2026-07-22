<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <!-- Header -->
    <header class="bg-gray-800 text-white shadow-md py-4 px-6 flex justify-between items-center">
      <h1 class="text-xl font-bold">Zam Zam Gold Mine - Visitor Portal</h1>
      <div class="flex items-center space-x-4">
        <span>{{ profile?.username }} (Visitor)</span>
        <button @click="logout" class="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm transition">
          Logout
        </button>
      </div>
    </header>

    <main class="flex-grow p-6 overflow-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Project Monitoring</h2>
      </div>

      <!-- Overall Summary Cards (Visitor restricted) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <p class="text-sm text-gray-500 uppercase font-bold">Total Capital</p>
          <p class="text-2xl font-bold text-gray-800">Rs. {{ totalCapital.toLocaleString() }}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <p class="text-sm text-gray-500 uppercase font-bold">Total Expenses</p>
          <p class="text-2xl font-bold text-gray-800">Rs. 0</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
          <p class="text-sm text-gray-500 uppercase font-bold">Remaining Balance</p>
          <p class="text-2xl font-bold text-gray-800">Rs. {{ totalCapital.toLocaleString() }}</p>
        </div>
        <!-- Gold Card is HIDDEN for Visitors -->
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="project in projects" :key="project.id" class="bg-white rounded-lg shadow-sm overflow-hidden">
          <div class="p-5">
            <h3 class="text-xl font-bold text-gray-800 mb-2">{{ project.name }}</h3>
            <p class="text-sm text-gray-600 mb-4">Assigned: <span class="font-medium">{{ project.assigned_user?.username }}</span></p>
            
            <div class="space-y-2 mb-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Capital:</span>
                <span class="font-bold">Rs. {{ project.capital_allocated?.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Remaining Balance:</span>
                <span class="font-bold text-green-600">Rs. {{ project.capital_allocated?.toLocaleString() }}</span>
              </div>
            </div>

            <button 
              class="w-full bg-gray-100 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
            >
              View Report (Read-only)
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
const { profile, logout } = useAuth()
const client = useSupabaseClient()
const projects = ref([])
const loading = ref(true)

const fetchProjects = async () => {
  loading.value = true
  const { data, error } = await client
    .from('projects')
    .select(`*, assigned_user:profiles(username)`)
  if (error) console.error(error)
  else projects.value = data
  loading.value = false
}

const totalCapital = computed(() => projects.value.reduce((sum, p) => sum + (p.capital_allocated || 0), 0))

onMounted(fetchProjects)
</script>
