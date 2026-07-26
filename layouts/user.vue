<template>
  <div class="min-h-screen flex overflow-hidden" style="background:#f3f4f6;">

    <!-- Sidebar -->
    <aside class="w-64 flex flex-col flex-shrink-0 relative overflow-hidden" style="background:#0d0d0d;">

      <!-- Mine background image -->
      <div
        class="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style="background-image:url('/mine-design.jpeg'); opacity:0.18;"
      ></div>
      <div class="absolute inset-0" style="background:linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 100%);"></div>

      <!-- Logo -->
      <div class="relative z-10 flex flex-col items-center pt-6 pb-4 px-4 border-b border-white border-opacity-10">
        <img src="/mine-logo.jpeg" alt="Zam Zam Gold Mine" class="w-20 h-20 object-contain mb-2" />
        <p class="text-xs text-gray-400 uppercase tracking-widest text-center leading-4">Project Portal</p>
      </div>

      <!-- Navigation -->
      <nav class="relative z-10 flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <button
          v-for="item in menuItems"
          :key="item.id"
          @click="$emit('select-module', item.id)"
          class="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition"
          :class="activeModule === item.id
            ? 'text-gray-900 font-semibold shadow-md'
            : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'"
          :style="activeModule === item.id ? 'background:linear-gradient(135deg,#d4a017,#b8860b);' : ''"
        >
          {{ item.name }}
        </button>
      </nav>

      <!-- User profile -->
      <div class="relative z-10 p-4 border-t border-white border-opacity-10">
        <div class="flex items-center space-x-3 mb-3">
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center text-gray-900 font-bold text-xs flex-shrink-0"
            style="background:linear-gradient(135deg,#d4a017,#b8860b);"
          >
            {{ profile?.username?.substring(0, 2).toUpperCase() }}
          </div>
          <div class="truncate">
            <p class="text-sm font-medium text-white truncate">{{ profile?.username }}</p>
            <p class="text-xs text-gray-400 capitalize">{{ profile?.role }}</p>
          </div>
        </div>
        <button
          @click="logout"
          class="w-full text-left text-xs text-gray-400 hover:text-white transition px-1"
        >
          Sign Out
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">

      <!-- Top bar -->
      <header class="h-16 border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0 bg-white">
        <h2 class="text-lg font-bold text-gray-800 capitalize">{{ activeModuleName }}</h2>
        <div class="flex items-center space-x-6">
          <div class="text-right">
            <p class="text-xs text-gray-400 uppercase font-semibold tracking-wide">Project</p>
            <p class="text-sm font-medium text-gray-700">{{ projectNames }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-400 uppercase font-semibold tracking-wide">Available Balance</p>
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
