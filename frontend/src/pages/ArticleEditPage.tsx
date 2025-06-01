import { useSearchParams } from "react-router"
export default function EditArticle(){
    const [searchParams]= useSearchParams();
    const id = searchParams.get("id");
    return (
        <>
        edit article {id}
        </>
    )
}