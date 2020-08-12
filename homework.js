/*
1,异步编程的EvenLoop就是不断的循环将宏任务队列或者是微任务队列添加掉调用栈中进行调用。
消息队列：消息队列是暂时存放异步任务的地方，等到同步代码执行完毕之后，event loop 会从消息
        队列取出异步任务放入调用栈中执行。
宏任务：   当前调用栈中执行的代码块称为宏任务，包括主代码块，定时器。
微任务：   宏任务执行完，在下一个宏任务之前需要执行的任务。
*/
const fp=require('lodash/fp')
// new Promise((resolve)=>{
//     setTimeout(function(){
//         resolve('hello')
//     },10)
// }).then(a=>{
//     return new Promise((resolve)=>{
//         setTimeout(function(){
//             resolve(a+'lagou')
//         },10)
//     })
// }).then(b=>{
//     return new Promise((resolve)=>{
//         setTimeout(() => {
//             console.log(b+"I love you")
//             resolve(b+"I love you")
//         }, 10);
//     })
// })


// //1,

// let isLastInStock=fp.flowRight(fp.curry(fp.prop('in_stock')),fp.last(cards))

// //2
// let isFirstInStock=fp.flowRight(fp.curry(fp.prop('name')),fp.first(cards))

// let _average=function(xs){
//     return fp.reduce(fp.add,0,xs)/xs.length
// }
// // let averageDollarValue=function(cars){
// //     let dollar_values=fp.map(function(car){
// //         return car.dollar_values
// //     },cars)
// //     return _average(dollar_values)
// // }
// //3
// let averageDollarValue=fp.flowRight(_average,fp.map(car=>car.dollar_values,cars))

// //4
// let _underscore=fp.replace(/\W+/g,'_')

// function sanitizeNames(nameList){
//     return fp.flowRight(fp.curry(fp.map(item=>_underscore(item))),fp.map(item=>item.toLocaleLowerCase(),nameList))
// }


//三
class Container{
    static of (value){
        return new Container(value)
    }
    constructor(value){
        this._value=value
    }
    map(fn){
        return Container.of(fn(this._value))
    }
}
class Maybe{
    static of(x){
        return new Maybe(x)
    }
    isNothing(){
        return this._value===null||this._value===undefined
    }
    constructor(x){
        this._value=x
    }
    map(fn){
        return this.isNothing()?this:Maybe.of(fn(this._value))
    }
}
let maybe=Maybe.of([5,6,7])
let ex1=()=>{
    return maybe.map(fp.map(fp.add(1)))
}


//2
let xs=Container.of(['do','ray','me'])
let ex2=()=>{
    return xs.map(fp.first)._value
}

//3
let safeProp=fp.curry(function(x,o){
    return Maybe.of(o[x])
})
let user={id:2,name:'albert'}
let ex3=()=>{
    return safeProp('name',user).map(fp.first)._value
}
//4

let ex4=function(n){
    return Maybe.of(n).map(parseInt)
}
//
// 定义promise的三种状态
const  PENDING='pending'
const  FULFILLED="fulfilled"
const  REJECTED="rejected"

class MyPromise{
    constructor(exec){//传入函数创建promise
        try{
            exec(this.resolve,this.reject)
        }catch(e){
            this.reject(e)//报错直接调用reject
        }

    }
    //初始状态
    status=PENDING
    // 定义成功值
    value=undefined
    // 定义失败值
    reason=undefined
    // 成功回调函数列表
    successCallback=[]
    //失败回调函数列表
    failCallback=[]
    resolve=(value)=>{
        if(this.status!==PENDING) return
        this.status=FULFILLED
        this.value=value
        while(this.successCallback.length){
            this.failCallback.shift()()
        }
    }
    reject=(reason)=>{
        if(this.status!==PENDING) return ;
        this.status=REJECTED
        this.reason=reason
        while(this.failCallback.length){
            this.failCallback.shift()()
        }
    }
    then(successCallback,failCallback){
        successCallback=successCallback?successCallback:value=>value//如果有成功回调则执行，否则成功回调就是一个返回value的函数
        failCallback=failCallback?failCallback:reason=>{throw reason}
        let promise=new MyPromise((resolve,reject)=>{
            if(this.status===FULFILLED){
                setTimeout(()=>{//异步执行
                    try{
                        let x=successCallback(this.value)
                        resolvePromise(promise,x,resolve,reject)
                    }catch(e){
                        reject(e)
                    }
                },0)
            }else if(this.status===REJECTED){
                setTimeout(() => {
                    try{
                        let x=failCallback(this.value)
                        resolvePromise(promise,x,resolve,reject)
                    }catch(e){
                        reject(e)
                    }
                }, 0);
            }else{
                this.successCallback.push(()=>{
                    setTimeout(()=>{
                        try{
                            x=successCallback(this.value)
                            resolvePromise(promise,x,resolve,reject)
                        }catch(e){
                            reject(e)
                        }
                    },0)
                })
                this.failCallback.push(()=>{
                    setTimeout(()=>{
                        try{
                            x=failCallback(this.value)
                            resolvePromise(promise,x,resolve,reject)
                        }catch(e){
                            reject(e)
                        }
                    },0)
                })
            }
        })
    }
    finally(cb){
        return this.then(value=>{
            return MyPromise.resolve(cb()).then(()=>value)
        },reason=>{
            return MyPromise.resolve(cb()).then(()=>{throw reason})
        })
    }
    catch(failCb){
        return this.then(undefined,failCb)
    }
}
function resolvePromise(promise,x,resolve,reject){
    if(x instanceof MyPromise){
        x.then(resolve,reject)
    }else{
        resolve(x)
    }
}
