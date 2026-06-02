<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Invoice {{ $order->order_number }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            font-size: 14px;
            margin: 0;
            padding: 0;
        }
        .invoice-box {
            max-width: 800px;
            margin: auto;
            padding: 30px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
            background: #fff;
        }
        .header {
            width: 100%;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .header table {
            width: 100%;
            line-height: inherit;
            text-align: left;
        }
        .header table td {
            padding: 5px;
            vertical-align: top;
        }
        .header table td.title {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
        }
        .header table td.right {
            text-align: right;
        }
        .details-table {
            width: 100%;
            margin-bottom: 30px;
        }
        .details-table td {
            vertical-align: top;
            width: 50%;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th, .items-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
            text-align: left;
        }
        .items-table th {
            background-color: #f8fafc;
            color: #333;
            font-weight: bold;
        }
        .items-table td.right, .items-table th.right {
            text-align: right;
        }
        .total-row td {
            font-weight: bold;
            border-top: 2px solid #333;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
        }
        .status-paid {
            background-color: #dcfce7;
            color: #166534;
        }
        .status-unpaid {
            background-color: #ffedd5;
            color: #9a3412;
        }
        .footer {
            text-align: center;
            color: #777;
            font-size: 12px;
            margin-top: 50px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="invoice-box">
        <div class="header">
            <table>
                <tr>
                    <td class="title">
                        GudangKomputer
                    </td>
                    <td class="right">
                        <h2>INVOICE</h2>
                        Order #: {{ $order->order_number }}<br>
                        Tanggal: {{ \Carbon\Carbon::parse($order->created_at)->format('d F Y') }}<br>
                        Status Pembayaran: 
                        @if($order->payment_status == 'paid')
                            <span class="status-badge status-paid">LUNAS</span>
                        @else
                            <span class="status-badge status-unpaid">BELUM LUNAS</span>
                        @endif
                    </td>
                </tr>
            </table>
        </div>

        <table class="details-table">
            <tr>
                <td>
                    <strong>Ditagihkan Kepada:</strong><br>
                    {{ $order->user->name }}<br>
                    {{ $order->user->email }}
                </td>
                <td style="text-align: right;">
                    <strong>Alamat Pengiriman:</strong><br>
                    {{ $order->recipient_name }}<br>
                    {{ $order->recipient_phone }}<br>
                    {{ $order->shipping_address }}
                </td>
            </tr>
        </table>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Kuantitas</th>
                    <th class="right">Harga Satuan</th>
                    <th class="right">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($order->items as $item)
                <tr>
                    <td>{{ $item->product ? $item->product->name : 'Produk tidak tersedia' }}</td>
                    <td style="text-align: center;">{{ $item->quantity }}</td>
                    <td class="right">Rp {{ number_format($item->price, 0, ',', '.') }}</td>
                    <td class="right">Rp {{ number_format($item->price * $item->quantity, 0, ',', '.') }}</td>
                </tr>
                @endforeach
                
                <tr>
                    <td colspan="3" class="right"><strong>Subtotal:</strong></td>
                    <td class="right">Rp {{ number_format($order->subtotal, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td colspan="3" class="right"><strong>Ongkos Kirim:</strong></td>
                    <td class="right">Rp {{ number_format($order->shipping_cost, 0, ',', '.') }}</td>
                </tr>
                <tr class="total-row">
                    <td colspan="3" class="right">TOTAL:</td>
                    <td class="right">Rp {{ number_format($order->total_price, 0, ',', '.') }}</td>
                </tr>
            </tbody>
        </table>

        @if($order->notes)
        <div style="margin-top: 20px;">
            <strong>Catatan Pesanan:</strong><br>
            {{ $order->notes }}
        </div>
        @endif

        <div class="footer">
            Terima kasih telah berbelanja di GudangKomputer!<br>
            Invoice ini dibuat secara otomatis oleh sistem dan sah tanpa tanda tangan.
        </div>
    </div>
</body>
</html>
