import { useSearchParams } from "react-router"
export default function CreateArticle(){
    const [searchParams]= useSearchParams();
    const id = searchParams.get("id");
    return (
        <>
        create article {id}
        </>
    )
}
