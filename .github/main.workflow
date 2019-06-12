workflow "Build and Test" {
  on = "push"
  resolves = ["docker://node:12-1"]
}

action "docker://node:12" {
  uses = "docker://node:12"
  runs = "yarn install --frozen-lockfile"
}

action "docker://node:12-1" {
  uses = "docker://node:12"
  needs = ["docker://node:12"]
  runs = "yarn test"
}
