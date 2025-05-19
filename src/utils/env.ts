export function getGeoApiKey(){
    return process.env.GEOAPI_KEY
}

export function getPlusAmount(type:'yearly'|'monthly'){
    if (type == 'monthly') {
        return process.env.PLUS_AMOUNT_MONTHLY
        
    }else{
        return process.env.PLUS_AMOUNT_YEARLY
        
    }
}