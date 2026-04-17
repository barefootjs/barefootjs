import { createConfig } from '@barefootjs/go-template/build'

export default createConfig({
  components: ['../shared/components'],
  outDir: 'dist',
  minify: true,
  adapterOptions: { packageName: 'main' },
  typesOutputFile: 'components.go',
})
