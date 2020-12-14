let obj=[1,2,3,4,5]

const tes=()=>{
    let obj=[1,2,3,4,5]
    let randomNumber
    let arrIndex=[]
    let isSame

    randomNumber=Math.floor(Math.random()*obj.length)
    arrIndex.push(randomNumber+1)
    for(x=1;x<4;x++){
        console.log(arrIndex, "array")
        do {
            randomNumber=Math.floor(Math.random()*obj.length)
            randomNumber+=1
            isSame=arrIndex.find((finding)=>{
                return finding == randomNumber
            })
            console.log(randomNumber, " rundem number")
            console.log(isSame, "sudah ada")
        } while (isSame);    

        arrIndex.push(randomNumber)    
    }

    return arrIndex
}

console.log(tes())