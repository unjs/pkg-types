import { defineBuildConfig } from "obuild/config"

export default defineBuildConfig({
  externals: [
    "#typescript"
  ],
  entries: ["src/index.ts"],
});
