import { useSearchParams } from "react-router";

export default function Profile(){
    const [searchParams]= useSearchParams();
    const id = searchParams.get("id");
    return (
        <>
        Profile {id}
        </>
    )
}
