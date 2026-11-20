package com.pixanimals.juego;

import android.content.pm.ApplicationInfo;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Compras dentro del juego con Google Play Billing (D277). Solo productos de pago único: las monedas y los cristales
 * son consumibles (se consumen al acreditarlos para poder volver a comprarlos) y el pack de bienvenida se reconoce.
 * El juego acredita primero y cierra después: si la app se cierra en medio, la compra sigue pendiente y se recupera.
 */
@CapacitorPlugin(name = "PixBilling")
public class PixBillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private interface Listo {
        void alTerminar(boolean conectado);
    }

    private interface ConDetalles {
        void alTener(ProductDetails detalles);
    }

    private BillingClient cliente;
    private final Map<String, ProductDetails> detalles = new HashMap<>();
    private PluginCall compraEnCurso;

    @Override
    public void load() {
        cliente =
            BillingClient
                .newBuilder(getContext())
                .setListener(this)
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .enableAutoServiceReconnection()
                .build();
    }

    private void conectar(final Listo listo) {
        if (cliente.isReady()) {
            listo.alTerminar(true);
            return;
        }
        final AtomicBoolean avisado = new AtomicBoolean(false);
        cliente.startConnection(
            new BillingClientStateListener() {
                @Override
                public void onBillingSetupFinished(BillingResult resultado) {
                    if (avisado.compareAndSet(false, true)) listo.alTerminar(resultado.getResponseCode() == BillingClient.BillingResponseCode.OK);
                }

                @Override
                public void onBillingServiceDisconnected() {}
            }
        );
    }

    private static QueryProductDetailsParams.Product producto(String id) {
        return QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(BillingClient.ProductType.INAPP).build();
    }

    /** ¿Es una versión de prueba (APK de depuración)? Ahí el juego usa la compra simulada. */
    @PluginMethod
    public void info(PluginCall call) {
        JSObject r = new JSObject();
        r.put("depuracion", (getContext().getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0);
        call.resolve(r);
    }

    /** Precios ya formateados en la moneda del jugador. `ids`: identificadores separados por comas. */
    @PluginMethod
    public void precios(final PluginCall call) {
        String texto = call.getString("ids", "");
        final List<QueryProductDetailsParams.Product> lista = new ArrayList<>();
        for (String id : texto.split(",")) if (!id.trim().isEmpty()) lista.add(producto(id.trim()));
        conectar(
            new Listo() {
                @Override
                public void alTerminar(boolean conectado) {
                    final JSObject precios = new JSObject();
                    if (!conectado || lista.isEmpty()) {
                        call.resolve(new JSObject().put("precios", precios));
                        return;
                    }
                    cliente.queryProductDetailsAsync(
                        QueryProductDetailsParams.newBuilder().setProductList(lista).build(),
                        (resultado, respuesta) -> {
                            if (resultado.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                                for (ProductDetails d : respuesta.getProductDetailsList()) {
                                    detalles.put(d.getProductId(), d);
                                    ProductDetails.OneTimePurchaseOfferDetails oferta = d.getOneTimePurchaseOfferDetails();
                                    if (oferta != null) precios.put(d.getProductId(), oferta.getFormattedPrice());
                                }
                            }
                            call.resolve(new JSObject().put("precios", precios));
                        }
                    );
                }
            }
        );
    }

    private void buscar(final String id, final ConDetalles alTener) {
        ProductDetails ya = detalles.get(id);
        if (ya != null) {
            alTener.alTener(ya);
            return;
        }
        List<QueryProductDetailsParams.Product> lista = new ArrayList<>();
        lista.add(producto(id));
        cliente.queryProductDetailsAsync(
            QueryProductDetailsParams.newBuilder().setProductList(lista).build(),
            (resultado, respuesta) -> {
                ProductDetails d = null;
                if (resultado.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    for (ProductDetails x : respuesta.getProductDetailsList()) {
                        detalles.put(x.getProductId(), x);
                        if (x.getProductId().equals(id)) d = x;
                    }
                }
                alTener.alTener(d);
            }
        );
    }

    private static JSObject estado(String estado) {
        JSObject r = new JSObject();
        r.put("estado", estado);
        return r;
    }

    /** Abre la ventana de pago de Google Play. Responde cuando el jugador termina o cancela. */
    @PluginMethod
    public void comprar(final PluginCall call) {
        final String id = call.getString("id", "");
        if (compraEnCurso != null) {
            call.resolve(estado("error"));
            return;
        }
        conectar(
            new Listo() {
                @Override
                public void alTerminar(boolean conectado) {
                    if (!conectado) {
                        call.resolve(estado("error"));
                        return;
                    }
                    buscar(
                        id,
                        new ConDetalles() {
                            @Override
                            public void alTener(final ProductDetails d) {
                                if (d == null || getActivity() == null) {
                                    call.resolve(estado("error"));
                                    return;
                                }
                                final List<BillingFlowParams.ProductDetailsParams> parametros = new ArrayList<>();
                                parametros.add(BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(d).build());
                                compraEnCurso = call;
                                getActivity()
                                    .runOnUiThread(
                                        () -> {
                                            BillingResult r = cliente.launchBillingFlow(
                                                getActivity(),
                                                BillingFlowParams.newBuilder().setProductDetailsParamsList(parametros).build()
                                            );
                                            if (r.getResponseCode() != BillingClient.BillingResponseCode.OK) terminarCompra(estado("error"));
                                        }
                                    );
                            }
                        }
                    );
                }
            }
        );
    }

    private void terminarCompra(JSObject respuesta) {
        PluginCall c = compraEnCurso;
        compraEnCurso = null;
        if (c != null) c.resolve(respuesta);
    }

    private static JSObject descripcion(Purchase p) {
        String token = p.getPurchaseToken();
        JSObject r = new JSObject();
        r.put("id", p.getProducts().isEmpty() ? "" : p.getProducts().get(0));
        r.put("recibo", p.getOrderId() != null ? p.getOrderId() : token.substring(Math.max(0, token.length() - 24)));
        r.put("token", token);
        return r;
    }

    @Override
    public void onPurchasesUpdated(BillingResult resultado, List<Purchase> compras) {
        int codigo = resultado.getResponseCode();
        if (codigo == BillingClient.BillingResponseCode.OK && compras != null) {
            JSObject respuesta = estado("pendiente");
            for (Purchase p : compras) {
                if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    respuesta = estado("ok");
                    respuesta.put("compra", descripcion(p));
                }
            }
            terminarCompra(respuesta);
        } else if (codigo == BillingClient.BillingResponseCode.USER_CANCELED) {
            terminarCompra(estado("cancelada"));
        } else if (codigo == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            terminarCompra(estado("poseido"));
        } else {
            terminarCompra(estado("error"));
        }
    }

    /** Compras cobradas que todavía no se cerraron (la app se cerró antes de acreditarlas, o las aprobó un adulto después). */
    @PluginMethod
    public void pendientes(final PluginCall call) {
        conectar(
            new Listo() {
                @Override
                public void alTerminar(boolean conectado) {
                    final JSObject r = new JSObject();
                    final JSArray lista = new JSArray();
                    if (!conectado) {
                        r.put("compras", lista);
                        call.resolve(r);
                        return;
                    }
                    cliente.queryPurchasesAsync(
                        QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),
                        (resultado, compras) -> {
                            if (resultado.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                                for (Purchase p : compras) if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) lista.put(descripcion(p));
                            }
                            r.put("compras", lista);
                            call.resolve(r);
                        }
                    );
                }
            }
        );
    }

    /** Cierra una compra ya acreditada: las monedas y cristales se consumen; el pack único se reconoce. */
    @PluginMethod
    public void cerrar(final PluginCall call) {
        final String token = call.getString("token", "");
        final boolean consumible = Boolean.TRUE.equals(call.getBoolean("consumible", true));
        conectar(
            new Listo() {
                @Override
                public void alTerminar(boolean conectado) {
                    if (!conectado) {
                        call.resolve(new JSObject().put("cerrada", false));
                        return;
                    }
                    if (consumible) {
                        cliente.consumeAsync(
                            ConsumeParams.newBuilder().setPurchaseToken(token).build(),
                            (resultado, t) -> call.resolve(new JSObject().put("cerrada", resultado.getResponseCode() == BillingClient.BillingResponseCode.OK))
                        );
                    } else {
                        cliente.acknowledgePurchase(
                            AcknowledgePurchaseParams.newBuilder().setPurchaseToken(token).build(),
                            resultado -> call.resolve(new JSObject().put("cerrada", resultado.getResponseCode() == BillingClient.BillingResponseCode.OK))
                        );
                    }
                }
            }
        );
    }
}
