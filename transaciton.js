class Transaction {
  constructor(wrappers) {
    this.wrappers = wrappers
  }
  perform(anyMethod) {
    this.wrappers.forEach(wrapper => wrapper.initialize())
    anyMethod.call()
    this.wrappers.forEach(wrapper => wrapper.initialize())
  }
}

let transaction = new Transaction([
  {
    initialize() {
      console.log('initialize1')
    },
    close() {
      console.log('close1')
    }
  },
  {
    initialize() {
      console.log('initialize2')
    },
    close() {
      console.log('close2')
    }
  }
])

transaction.perform(() => {
  console.log('setState')
})