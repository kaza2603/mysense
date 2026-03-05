<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  LogOut,
  Menu,
  X,
  Building,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { IstimewaKuLogo } from '@/components/logo'

const router = useRouter()
const auth = useAuthStore()
const isSidebarOpen = ref(false)

const sidebarItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
  },
  {
    title: 'Pelajar',
    icon: GraduationCap,
    path: '/admin/students',
  },
  {
    title: 'Ibu Bapa',
    icon: Users,
    path: '/admin/parents',
  },
  {
    title: 'Guru',
    icon: School,
    path: '/admin/teachers',
  },
  {
    title: 'Sekolah & Kelas',
    icon: Building,
    path: '/admin/school-classes',
  },
  {
    title: 'Sekolah',
    icon: School,
    path: '/admin/school-registration',
  },
]

const handleLogout = () => {
  auth.logout()
  router.push('/login-admin')
}

const isActive = (path) => router.currentRoute.value.path === path
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Mobile Sidebar Toggle -->
    <div
      class="lg:hidden fixed top-0 left-0 w-full bg-white border-b z-50 px-4 h-16 flex items-center"
      :style="{
        paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom))',
      }"
    >
      <Sheet v-model:open="isSidebarOpen">
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu class="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          class="w-[300px] p-0"
          aria-label="Menu Navigasi"
          aria-describedby="nav-description"
        >
          <div id="nav-description" class="sr-only">
            Menu navigasi untuk mengakses bahagian-bahagian panel pentadbir
          </div>
          <!-- Mobile Sidebar Content -->
          <div class="h-full bg-white flex flex-col">
            <div>
              <div
                class="p-6 flex-1 justify-center items-center space-y-1"
                :style="{
                  paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
                }"
              >
                <SheetTitle class="sr-only">Panel Pentadbir IstimewaKu</SheetTitle>
                <IstimewaKuLogo class="h-8 w-full justify-center" />
                <p class="text-sm font-semibold text-center text-gray-500">Panel Pentadbir</p>
              </div>
              <nav class="flex-1 px-2">
                <div class="space-y-1">
                  <router-link
                    v-for="item in sidebarItems"
                    :key="item.path"
                    :to="item.path"
                    :class="[
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive(item.path)
                        ? 'bg-yellow-50 text-yellow-600'
                        : 'text-gray-600 hover:bg-yellow-50 hover:text-yellow-600',
                    ]"
                    @click="isSidebarOpen = false"
                  >
                    <component :is="item.icon" class="h-5 w-5 mr-3" />
                    {{ item.title }}
                  </router-link>
                </div>
              </nav>
            </div>
            <!-- Mobile logout button at bottom -->
            <div class="mt-auto p-4 border-t">
              <Button
                variant="ghost"
                class="w-full justify-start text-red-600"
                @click="handleLogout"
              >
                <LogOut class="h-5 w-5 mr-3" />
                Log Keluar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <div class="ml-4 text-lg font-semibold">Panel Pentadbir</div>
    </div>

    <!-- Desktop Sidebar -->
    <div class="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div class="flex flex-col flex-grow bg-white border-r">
        <div class="flex-shrink-0 p-6">
          <IstimewaKuLogo class="h-8 w-full justify-center" />
          <p class="text-sm font-semibold text-center text-gray-500">Panel Pentadbir</p>
        </div>
        <nav class="flex-1 px-4 pb-4">
          <div class="space-y-1">
            <router-link
              v-for="item in sidebarItems"
              :key="item.path"
              :to="item.path"
              :class="[
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive(item.path)
                  ? 'bg-yellow-50 text-yellow-600'
                  : 'text-gray-600 hover:bg-yellow-50 hover:text-yellow-600',
              ]"
            >
              <component :is="item.icon" class="h-5 w-5 mr-3" />
              {{ item.title }}
            </router-link>
          </div>
        </nav>
        <div class="flex-shrink-0 p-4 border-t">
          <Button variant="ghost" class="w-full justify-start text-red-600" @click="handleLogout">
            <LogOut class="h-5 w-5 mr-3" />
            Log Keluar
          </Button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="lg:pl-64">
      <main class="pt-28 lg:pt-6 px-4 sm:px-6 lg:px-8 h-full pb-8">
        <slot />
      </main>
    </div>
  </div>
</template>
