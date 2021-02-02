import fs from "fs";

export default {
  methods: {
    async readFiles(
      folderPath,
      verbose = true,
      filetypes = ["json", "lottie"]
    ) {
      let mapped = [];
      let folderContents = await this.readDir(folderPath);
      folderContents = folderContents.filter((item) => {
        return new RegExp(`${filetypes.join("|")}$`).test(item);
      });
      for (const filepath of folderContents.map((file) => {
        return `${folderPath.replace(/(\\|\/)$/, "")}/${file}`;
      }))
        mapped.push(await this.readFile(filepath, verbose));
      return mapped;
    },
    async readFile(targetPath, verbose = true) {
      return new Promise((resolve, reject) => {
        fs.readFile(targetPath, "utf-8", (err, data) => {
          if (err) reject(err);
          if (!verbose) resolve(data);
          let temp = {
            data: data,
            stats: fs.lstatSync(targetPath),
          };
          resolve(temp);
        });
      });
    },
    async readDir(targetPath) {
      return new Promise((resolve, reject) => {
        if (!this.isFolder(targetPath))
          reject("Path is not a folder or does not exist");
        fs.readdir(targetPath, { encoding: "utf-8" }, (err, files) => {
          if (err) reject(err);
          resolve(files);
        });
      });
    },
    isFolder(targetPath) {
      return fs.lstatSync(targetPath).isDirectory();
    },
    exists(targetPath) {
      return fs.existsSync(targetPath);
    },
  },
};
