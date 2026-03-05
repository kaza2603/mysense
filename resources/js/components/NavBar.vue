<script setup>
import { ref, computed } from 'vue'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu, Home, Users, LightbulbIcon, LogIn, LogOut, LayoutDashboard } from 'lucide-vue-next'
import { IstimewaKuLogo } from '@/components/logo'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const isOpen = ref(false)
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const navigation = [
  { name: 'Utama', href: '/', icon: Home },
  { name: 'Motivasi', href: '/motivasi', icon: LightbulbIcon },
  { name: 'Penyumbang Bahan', href: '/penyumbang-bahan', icon: Users },
]

const isActive = (path) => route.path === path

const handleLogout = () => {
  auth.logout()
  router.push('/')
}

const navigateToDashboard = () => {
  router.push('/parent/dashboard')
}

const userName = computed(() => auth.currentUser?.name || '')

const isParentDashboard = computed(() => {
  const parentRoutes = ['/parent/dashboard', '/parent/my-children']
  return parentRoutes.some((path) => route.path.startsWith(path))
})
</script>

<template>
  <template v-if="!isParentDashboard">
    <!-- Desktop Navigation -->
    <nav
      class="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50"
    >
      <div class="container mx-auto px-4 flex items-center justify-between">
        <div class="flex items-center justify-between w-full">
          <div>
            <!-- Logo -->
            <RouterLink to="/" class="text-2xl font-bold text-yellow-500">
              <IstimewaKuLogo class="h-8 w-auto inline-block mr-2" />
            </RouterLink>
          </div>
          <div class="flex items-center space-x-4">
            <RouterLink
              v-for="item in navigation"
              :key="item.name"
              :to="item.href"
              :class="[
                'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive(item.href)
                  ? 'text-yellow-600 bg-yellow-50'
                  : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50',
              ]"
            >
              <component :is="item.icon" class="h-4 w-4 mr-2" />
              {{ item.name }}
            </RouterLink>
          </div>
          <div v-if="!auth.isParentAuthenticated">
            <RouterLink to="/parent/login">
              <Button
                variant="outline"
                class="border-yellow-500 text-yellow-500 hover:bg-yellow-50"
              >
                <LogIn class="mr-2 h-4 w-4" />
                Log Masuk Ibu Bapa
              </Button>
            </RouterLink>
          </div>
          <div v-else class="flex items-center space-x-4">
            <span class="text-gray-600">Selamat datang, {{ userName }}</span>
            <Button
              variant="outline"
              class="border-yellow-500 text-yellow-500 hover:bg-yellow-50"
              @click="navigateToDashboard"
            >
              <LayoutDashboard class="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant="outline"
              class="border-red-500 text-red-500 hover:bg-red-50"
              @click="handleLogout"
            >
              <LogOut class="mr-2 h-4 w-4" />
              Log Keluar
            </Button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Mobile Navigation -->
    <Sheet v-model:open="isOpen">
      <div
        class="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center px-4"
        :style="{
          paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom))',
        }"
      >
        <SheetTrigger as-child>
          <Button variant="ghost" size="icon" class="md:hidden">
            <Menu class="h-6 w-6" />
            <span class="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>

        <RouterLink to="/" class="mx-auto text-xl font-bold text-yellow-500">
          <IstimewaKuLogo class="h-8 w-auto" />
        </RouterLink>
      </div>

      <SheetContent
        side="left"
        class="w-[280px] sm:w-[350px]"
        :style="{
          paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom))',
        }"
      >
        <SheetHeader>
          <SheetTitle>IstimewaKu</SheetTitle>
        </SheetHeader>

        <div class="flex flex-col space-y-4 mt-6">
          <RouterLink
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            :class="[
              'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
              isActive(item.href)
                ? 'text-yellow-600 bg-yellow-50'
                : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50',
            ]"
            @click="isOpen = false"
          >
            <component :is="item.icon" class="h-4 w-4 mr-2" />
            {{ item.name }}
          </RouterLink>

          <template v-if="!auth.isParentAuthenticated">
            <RouterLink to="/parent/login" @click="isOpen = false">
              <Button class="mt-4 w-full" variant="outline">
                <LogIn class="mr-2 h-4 w-4" />
                Log Masuk
              </Button>
            </RouterLink>
          </template>
          <template v-else>
            <div class="px-3 py-2 text-sm text-gray-600">Selamat datang, {{ userName }}</div>
            <Button class="w-full" variant="outline" @click="navigateToDashboard">
              <LayoutDashboard class="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button class="w-full" variant="outline" @click="handleLogout">
              <LogOut class="mr-2 h-4 w-4" />
              Log Keluar
            </Button>
          </template>
        </div>
      </SheetContent>
    </Sheet>
  </template>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>
