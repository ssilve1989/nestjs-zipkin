workflow "Build and Test" {
  on = "push"
  resolves = ["Test"]
}

action "Install" {
  uses = "docker://node:12"
  runs = "yarn install --frozen-lockfile"
}

action "Test" {
  uses = "docker://node:12"
  runs = "yarn test"
  needs = ["Install"]
}
