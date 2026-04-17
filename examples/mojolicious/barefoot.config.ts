import { createConfig } from '@barefootjs/mojolicious/build'

export default createConfig({
  components: ['../shared/components'],
  outDir: 'dist',
  adapterOptions: {
    clientJsBasePath: '/client/',
    barefootJsPath: '/client/barefoot.js',
  },
})
