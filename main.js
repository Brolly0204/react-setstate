class Transaction {
  constructor(wrappers) {
    this.wrappers = wrappers
  }
  perform(anyMethod) {
    this.wrappers.forEach(wrapper => wrapper.initialize())
    anyMethod()
    this.wrappers.forEach(wrapper => wrapper.close())
  }
}

const batchingStrategy = {
  isBatchingUpdates: false,
  dirtyComponents: [],
  batchingUpdates() {
    this.dirtyComponents.forEach(component => component.updateComponent())
  }
}

class Updater {
  constructor(component) {
    this.component = component
    this.pendingStates = []
  }
  // setState() => addState()
  addState(partialState) {
    // 把传递记录转态缓存
    this.pendingStates.push(partialState)

    // 判断开启批量更新模式
    if (batchingStrategy.isBatchingUpdates) {
      batchingStrategy.dirtyComponents.push(this.component)
      return
    }

    // 未开启批量更新模式时 直接合并状态并更新视图
    this.component.updateComponent()
  }
}

class Component {
  constructor(props) {
    this.props = props
    this.$updater = new Updater(this)
  }
  setState(partialState) {
    this.$updater.addState(partialState)
  }
  updateComponent() {
    // Object.assign(this.state, {count: 2})
    this.$updater.pendingStates.forEach(partialState =>
      Object.assign(this.state, partialState)
    )
    this.$updater.pendingStates.length = 0
    let oldElement = this.DOMElement
    let newElement = this.renderElement()
    oldElement.parentNode.replaceChild(newElement, oldElement)
  }
  createDOMFromDOMString(htmlStr) {
    const div = document.createElement('div')
    div.innerHTML = htmlStr
    return div.children[0]
  }
  renderElement() {
    let htmlStr = this.render()
    this.DOMElement = this.createDOMFromDOMString(htmlStr)
    this.DOMElement.component = this
    return this.DOMElement
  }
  mount(container) {
    container.appendChild(this.renderElement())
  }
}

const transaction = new Transaction([
  {
    initialize() {
      // 开启批量更新模式
      batchingStrategy.isBatchingUpdates = true
    },
    close() {
      // 事件执行之后
      batchingStrategy.isBatchingUpdates = false // 关闭批量更新模式
      // 进行批量更新
      batchingStrategy.batchingUpdates.call(batchingStrategy)
    }
  }
])
// 事件代理
window.trigger = function(event, methodName) {
  // 事件执行之前

  // 当前组件实例
  let component = event.target.component
  // 通过组件实例['add']()
  transaction.perform(component[methodName].bind(component, event))
}

class Counter extends Component {
  constructor(props) {
    super(props)
    this.state = {
      count: 0
    }
  }
  add() {
    this.setState({
      count: this.state.count + 1
    })
    console.log('1', this.state.count) // 0

    this.setState({
      count: this.state.count + 1
    })
    console.log('2', this.state.count)

    // setTimeout因为是异步的 是在add方法执行完后才执行的
    // 由于add事件函数执行完后 就立马关闭了批量更新模式
    setTimeout(() => {
      // console.log('state', this.state) // {count: 1}
      this.setState({
        count: this.state.count + 1 // {count: 2}
      })
      console.log('3', this.state.count)
      this.setState({
        count: this.state.count + 1
      })
      console.log('4', this.state.count)
    }, 0)
  }
  render() {
    return `<button class="btn" onClick="trigger(event, 'add')" >${
      this.props.name
    } ${this.state.count}</button>`
  }
}
