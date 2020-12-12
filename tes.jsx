let arr=[true,true,true]
const isalltrue=()=>{
    // let a=true
    let a=arr.find((finding)=>{
        console.log(finding)
        return finding==false
    })
    console.log(a)
    if(a!==false){
        a=true
    }
    return a
}

console.log(isalltrue())