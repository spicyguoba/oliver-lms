import Adventure from "../../../components/Adventure";
export default async function Page({ params }) {
  const { id } = await params;
  return <Adventure id={id} />;
}
