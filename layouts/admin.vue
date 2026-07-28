<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <!-- Header -->
    <header class="bg-[#000] text-white shadow-md px-4 md:px-6 flex justify-between items-center py-2 md:py-0">
      <div class="flex items-center gap-3">
        <button
          @click="mobileMenuOpen = true"
          class="md:hidden flex-shrink-0 p-1.5 -ml-1.5 text-gray-200 hover:text-white"
          aria-label="Open menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <img src="/sidebar-logo.png" alt="Zam Zam Gold Mine" class="w-16 h-12 md:w-30 md:h-20 object-contain" />
        <h1 class="text-base md:text-xl font-bold text-yellow-400 truncate">Super Admin</h1>
      </div>
      <div class="flex items-center space-x-4 flex-shrink-0">
        <button @click="logout" class="bg-yellow-700 hover:bg-yellow-800 px-3 py-1 rounded text-sm transition">
          Logout
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-grow flex overflow-hidden">

      <!-- Mobile backdrop -->
      <div
        v-if="mobileMenuOpen"
        @click="mobileMenuOpen = false"
        class="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
      ></div>

      <!-- Sidebar -->
      <aside
        class="w-64 bg-white shadow-md fixed inset-y-0 left-0 z-40 overflow-y-auto transition-transform duration-200 md:static md:translate-x-0"
        :class="mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <nav class="mt-5 px-2">
          <NuxtLink
            to="/admin"
            @click="mobileMenuOpen = false"
            class="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            :class="{ 'bg-gray-100 text-gray-900': $route.path === '/admin' }"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink
            to="/admin/users"
            @click="mobileMenuOpen = false"
            class="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            :class="{ 'bg-gray-100 text-gray-900': $route.path === '/admin/users' }"
          >
            Manage Accounts
          </NuxtLink>
        </nav>
      </aside>

      <!-- Page Content -->
      <main class="flex-1 p-4 md:p-6 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
const { logout } = useAuth()
const mobileMenuOpen = ref(false)
</script>
