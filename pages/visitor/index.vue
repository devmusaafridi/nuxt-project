<script setup>
const { profile, logout } = useAuth()
const projects = ref([])
const loading = ref(true)

const totalCapital = computed(() => projects.value.reduce((sum, p) => sum + (p.capital_allocated || 0), 0))

onMounted(async () => {
  try {
    projects.value = await $fetch('/api/projects')
  } catch (err) {
    console.error('[visitor] failed to load projects:', err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background:#f3f4f6;">

    <!-- Header -->
    <header class="relative overflow-hidden flex-shrink-0" style="background:#0d0d0d; min-height:80px;">
      <!-- Mine background -->
      <div
        class="absolute inset-0 bg-cover bg-center"
        style="background-image:url('/mine-design.jpeg'); opacity:0.2;"
      ></div>
      <div class="absolute inset-0" style="background:linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 100%);"></div>

      <div class="relative z-10 flex items-center justify-between px-8 py-4">
        <!-- Logo + name -->
        <div class="flex items-center space-x-4">
          <img src="/sidebar-logo.jpg" alt="Zam Zam Gold Mine" class="w-12 h-12 object-contain" />
          <div>
            <h1 class="text-white font-bold text-lg leading-tight">Zam Zam Gold Mine</h1>
            <p class="text-xs uppercase tracking-widest" style="color:#d4a017;">Management System</p>
          </div>
        </div>

        <!-- User info + logout -->
        <div class="flex items-center space-x-4">
          <div class="text-right">
            <p class="text-white text-sm font-medium">{{ profile?.username }}</p>
            <p class="text-xs text-gray-400 capitalize">{{ profile?.role }}</p>
          </div>
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center text-gray-900 font-bold text-xs"
            style="background:linear-gradient(135deg,#d4a017,#b8860b);"
          >
            {{ profile?.username?.substring(0, 2).toUpperCase() }}
          </div>
          <button
            @click="logout"
            class="text-xs text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 px-3 py-1.5 rounded-md transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <!-- Page Content -->
    <main class="flex-grow p-8 overflow-auto">

      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Project Monitoring</h2>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <p class="text-xs text-gray-400 uppercase font-bold tracking-wide mb-1">Total Capital</p>
          <p class="text-2xl font-bold text-gray-800">Rs. {{ totalCapital.toLocaleString() }}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <p class="text-xs text-gray-400 uppercase font-bold tracking-wide mb-1">Total Expenses</p>
          <p class="text-2xl font-bold text-gray-800">Rs. 0</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
          <p class="text-xs text-gray-400 uppercase font-bold tracking-wide mb-1">Remaining Balance</p>
          <p class="text-2xl font-bold text-gray-800">Rs. {{ totalCapital.toLocaleString() }}</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>

      <!-- Empty -->
      <div v-else-if="projects.length === 0" class="flex flex-col items-center justify-center py-20 text-gray-400">
        <p class="text-lg font-medium">No projects found.</p>
      </div>

      <!-- Project Cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="project in projects"
          :key="project.id"
          class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition border border-gray-100"
        >
          <!-- Card top accent -->
          <div class="h-1 w-full" style="background:linear-gradient(135deg,#d4a017,#b8860b);"></div>
          <div class="p-5">
            <h3 class="text-lg font-bold text-gray-800 mb-1">{{ project.name }}</h3>
            <p class="text-xs text-gray-500 mb-4">
              Assigned: <span class="font-medium text-gray-700">{{ project.assigned_user?.username || 'Unassigned' }}</span>
            </p>
            <div class="space-y-2 mb-5">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Capital</span>
                <span class="font-bold text-gray-800">Rs. {{ project.capital_allocated?.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Remaining Balance</span>
                <span class="font-bold text-green-600">Rs. {{ project.capital_allocated?.toLocaleString() }}</span>
              </div>
            </div>
            <NuxtLink
              :to="`/visitor/projects/${project.id}`"
              class="block text-center py-2 rounded-lg text-sm font-semibold text-white transition"
              style="background:linear-gradient(135deg,#d4a017,#b8860b);"
            >
              View Report
            </NuxtLink>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>
