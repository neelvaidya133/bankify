import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ProductGrid from "./components/ProductGrid";

export default async function CatalogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">Catalog</h1>
          <div className="w-full sm:w-auto">
            <select
              className="w-full sm:w-48 px-3 py-2 border rounded-md"
              defaultValue=""
            >
              <option value="">All Categories</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Vehicles">Vehicles</option>
              <option value="Investments">Investments</option>
              <option value="Financial Services">Financial Services</option>
              <option value="Experiences">Experiences</option>
            </select>
          </div>
        </div>
        <ProductGrid products={products || []} />
      </div>
    </div>
  );
}
