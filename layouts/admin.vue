<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <!-- Header -->
    <header class="bg-[#000] text-white shadow-md px-6 flex justify-between items-center">
    <div class="flex items-center space-x-4">
      <img src="/sidebar-logo.png" alt="Zam Zam Gold Mine" class="w-30 h-20 object-contain" />
      </div>
      <h1 class="text-xl font-bold text-yellow-400">Super Admin</h1>
      <div class="flex items-center space-x-4">
        <button @click="logout" class="bg-yellow-700 hover:bg-yellow-800 px-3 py-1 rounded text-sm transition">
          Logout
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-grow flex">
      <!-- Sidebar -->
      <aside class="w-64 bg-white shadow-md hidden md:block">
        <nav class="mt-5 px-2">
          <NuxtLink
            to="/admin"
            class="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            :class="{ 'bg-gray-100 text-gray-900': $route.path === '/admin' }"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink
            to="/admin/users"
            class="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            :class="{ 'bg-gray-100 text-gray-900': $route.path === '/admin/users' }"
          >
            Manage Accounts
          </NuxtLink>
        </nav>
      </aside>

      <!-- Page Content -->
      <main class="flex-1 p-6 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
const { logout } = useAuth()
</script>
