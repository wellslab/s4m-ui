// Example of middleware function, which will run prior to page rendering on server side (so console.log here will print on server side)
export default function({$axios, redirect}) {
    $axios
        .$get('https://api.stemformatics.org/samples / metadata/7171/metadata', {headers: {"Access-Control-Allow-Origin": "*"}})
        .then(res => {
            // can check for token here:
            //if (res.token!='Qpwlsfek')
            //  redirect('/')
            console.log(res)
        })
}