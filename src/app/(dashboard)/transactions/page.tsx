"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { formatCurrency } from "@/utils/card-utils";
import { format } from "date-fns";

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  transaction_type: string;
  status: string;
  description: string;
  merchant_name: string;
  merchant_category: string;
  main_cards: {
    card_number: string;
    card_type: string;
  };
  secondary_cards?: {
    card_number: string;
    card_type: string;
  };
  temp_cards?: {
    card_number: string;
    expiry_date: string;
    status: string;
  };
}

export default function TransactionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({
    type: "all",
    status: "all",
    category: "all",
  });
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const ITEMS_PER_PAGE = 10;

  const fetchTransactions = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // First, get total count for pagination
    const { count } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (count !== null) {
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
    }

    // Then fetch paginated data
    const { data: transactions } = await supabase
      .from("transactions")
      .select(
        `
        *,
        main_cards:card_id (
          card_number,
          card_type
        ),
        temp_cards:temporary_cards (
          card_number,
          expiry_date,
          status
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE - 1
      );

    if (transactions) {
      setTransactions(transactions);
      setLoading(false);
    } else {
      console.error("Error fetching transactions");
      setLoading(false);
    }
  }, [supabase, router, currentPage]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "withdrawal":
        return "text-red-600";
      case "deposit":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <select
          className="form-select"
          value={filter.type}
          onChange={(e) =>
            setFilter((prev) => ({ ...prev, type: e.target.value }))
          }
        >
          <option value="all">All Types</option>
          <option value="withdrawal">Withdrawals</option>
          <option value="deposit">Deposits</option>
        </select>

        <select
          className="form-select"
          value={filter.status}
          onChange={(e) =>
            setFilter((prev) => ({ ...prev, status: e.target.value }))
          }
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <select
          className="form-select"
          value={filter.category}
          onChange={(e) =>
            setFilter((prev) => ({ ...prev, category: e.target.value }))
          }
        >
          <option value="all">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="entertainment">Entertainment</option>
          <option value="food">Food</option>
          <option value="travel">Travel</option>
        </select>

        <div className="flex gap-2">
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>
          <button
            className="btn btn-outline"
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="text-center py-8">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No transactions found
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Card
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(
                        new Date(transaction.created_at),
                        "MMM d, yyyy HH:mm"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.merchant_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.transaction_type === "payment" ? (
                        <>
                          <div className="text-sm text-gray-900">
                            Debit Card
                          </div>
                          <div className="text-sm text-gray-500">
                            Bill Payment
                          </div>
                        </>
                      ) : transaction.temp_cards ? (
                        <>
                          <div className="text-sm text-gray-900">
                            Temporary Card
                          </div>
                          <div className="text-sm text-gray-500">
                            **** **** ****{" "}
                            {transaction.temp_cards.card_number.slice(-4)}
                          </div>
                          <div className="text-xs text-gray-400">
                            Expires: {transaction.temp_cards.expiry_date}
                          </div>
                        </>
                      ) : transaction.main_cards ? (
                        <>
                          <div className="text-sm text-gray-900">
                            {transaction.main_cards.card_type}
                          </div>
                          <div className="text-sm text-gray-500">
                            **** **** ****{" "}
                            {transaction.main_cards.card_number.slice(-4)}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">N/A</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.merchant_category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${getTransactionTypeColor(
                          transaction.transaction_type
                        )}`}
                      >
                        {transaction.transaction_type === "withdrawal"
                          ? "-"
                          : "+"}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white rounded-lg shadow p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.description}
                    </div>
                    <div className="text-xs text-gray-500">
                      {transaction.merchant_name}
                    </div>
                  </div>
                  <span
                    className={`text-sm font-medium ${getTransactionTypeColor(
                      transaction.transaction_type
                    )}`}
                  >
                    {transaction.transaction_type === "withdrawal" ? "-" : "+"}
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <span className="ml-2 text-gray-900">
                      {format(
                        new Date(transaction.created_at),
                        "MMM d, yyyy HH:mm"
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-2 text-gray-900">
                      {transaction.merchant_category}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Card:</span>
                    <span className="ml-2 text-gray-900">
                      {transaction.transaction_type === "payment" ? (
                        "Debit Card - Bill Payment"
                      ) : transaction.temp_cards ? (
                        <>
                          Temporary Card
                          <br />
                          **** **** ****{" "}
                          {transaction.temp_cards.card_number.slice(-4)}
                        </>
                      ) : transaction.main_cards ? (
                        <>
                          {transaction.main_cards.card_type}
                          <br />
                          **** **** ****{" "}
                          {transaction.main_cards.card_number.slice(-4)}
                        </>
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span
                      className={`ml-2 font-medium ${getStatusColor(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="mt-4 flex justify-center items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Previous
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
