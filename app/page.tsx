import { createClient } from "@supabase/supabase-js";

export default async function Home() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    const { data: items, error } = await supabase
        .from("week2_items")
        .select("*")
        .order("id");

    if (error) {
        return <main>Error loading items: {error.message}</main>;
    }

    return (
        <main>
            <h1>AI Agents</h1>

            <ul>
                {items?.map((item) => (
                    <li key={item.id}>
                        <strong>{item.name}</strong>: {item.description}
                    </li>
                ))}
            </ul>
        </main>
    );
}