<template>
  <div class="min-h-screen bg-gray-50 flex overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
      <div class="p-6 text-center border-b border-gray-800">
        <h2 class="text-xl font-bold text-yellow-500">Gold Mine</h2>
        <p class="text-xs text-gray-400 mt-1 uppercase tracking-widest">Project Portal</p>
      </div>

      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <button
          v-for="item in menuItems"
          :key="item.id"
          @click="$emit('select-module', item.id)"
          class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition"
          :class="activeModule === item.id ? 'bg-yellow-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'"
        >
          {{ item.name }}
        </button>
      </nav>

      <div class="p-4 border-t border-gray-800">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-gray-900 font-bold text-xs">
            {{ profile?.username?.substring(0, 2).toUpperCase() }}
          </div>
          <div class="truncate">
            <p class="text-sm font-medium truncate">{{ profile?.username }}</p>
            <p class="text-xs text-gray-400 capitalize">{{ profile?.role }}</p>
          </div>
        </div>
        <button @click="logout" class="w-full text-left text-xs text-gray-400 hover:text-white transition">
          Sign Out
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
      <header class="h-16 border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
        <h2 class="text-lg font-bold text-gray-800 capitalize">{{ activeModuleName }}</h2>
        <div class="flex items-center space-x-6">
          <div class="text-right">
            <p class="text-xs text-gray-500">Project</p>
            <p class="text-sm font-medium text-gray-700">{{ projectNames }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-500">Available Balance</p>
            <p class="text-sm font-bold text-green-600">Rs. {{ availableBalance.toLocaleString() }}</p>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto p-8">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
const props = defineProps({
  activeModule: { type: String, default: '' },
  menuItems: { type: Array, default: () => [] }
})
const emit = defineEmits(['select-module'])
const { profile, logout } = useAuth()

const projects = ref([])
const availableBalance = computed(() =>
  projects.value.reduce((sum, p) => sum + (p.capital_allocated || 0), 0)
)
const projectNames = computed(() =>
  projects.value.map(p => p.name).join(', ') || 'No project assigned'
)

onMounted(async () => {
  try {
    projects.value = await $fetch('/api/my-project')
  } catch (err) {
    console.error('[user layout] failed to load project:', err?.data?.message ?? err?.message ?? err)
  }
})

const activeModuleName = computed(() => {
  return props.menuItems.find(i => i.id === props.activeModule)?.name || 'Dashboard'
})
</script>
