import React, { Suspense } from 'react';
import { AppProvider } from '@shopify/polaris';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import '@shopify/polaris/build/esm/styles.css';
import { Spinner, Frame, Navigation } from '@shopify/polaris';

// Lazy load all modules (just an example structure to fulfill Prompt 4)
const PazaryeriPage = React.lazy(() => import('./pages/g1/index'));
const UrunDurum = React.lazy(() => import('./pages/g1/index'));
const StokUyari = React.lazy(() => import('./pages/g2/stok-uyari'));
const StokTransfer = React.lazy(() => import('./pages/g2/stok-transfer'));
const FiyatAnomali = React.lazy(() => import('./pages/g2/fiyat-anomali'));
const Lokalizasyon = React.lazy(() => import('./pages/g2/fiyat-lokalizasyon'));
const FedexHesaplayici = React.lazy(() => import('./pages/g3/fedex-calculator'));
const HsCode = React.lazy(() => import('./pages/g3/hs-code-manager'));
const Gumruk = React.lazy(() => import('./pages/g3/customs-report'));
const OemMatrix = React.lazy(() => import('./pages/g4/oem-matrix'));
const Fitment = React.lazy(() => import('./pages/g4/fitment-manager'));
const Kategori = React.lazy(() => import('./pages/g4/category-mapper'));
const KatalogAnalizi = React.lazy(() => import('./pages/g5/katalog-analizi'));
const MarkaPerformansi = React.lazy(() => import('./pages/g5/marka-performansi'));
const SiparisAnalizi = React.lazy(() => import('./pages/g5/siparis-analizi'));
const Bekleyen = React.lazy(() => import('./pages/g5/bekleyen-siparisler'));
const IadeAnalizi = React.lazy(() => import('./pages/g5/iade-analizi'));
const PnL = React.lazy(() => import('./pages/g5/pnl-hesaplayici'));
const GorselKalite = React.lazy(() => import('./pages/g6/gorsel-kalite-kontrol'));
const DosyaYonetici = React.lazy(() => import('./pages/g6/dosya-yoneticisi'));
const CeviriDurumu = React.lazy(() => import('./pages/g6/ceviri-durumu'));
const MetafieldAudit = React.lazy(() => import('./pages/g7/MetafieldAudit'));
const BosKoleksiyon = React.lazy(() => import('./pages/g7/EmptyCollectionDetector'));
const Redirect = React.lazy(() => import('./pages/g7/RedirectManager'));
const GraphQLTest = React.lazy(() => import('./pages/g7/GraphQLTestTool'));
const Discount = React.lazy(() => import('./pages/g7/DiscountGenerator'));
const StoreConfig = React.lazy(() => import('./pages/g7/store-config'));
const ImageProcessor = React.lazy(() => import('./pages/g6/ImageProcessor'));

export default function App() {
  const navMenu = (
    <Navigation location="/">
      <Navigation.Section
        items={[
          { label: 'G1: Ürün Yönetimi', url: '/g1' },
          { label: 'G2: Stok Uyarı', url: '/g2/stok' },
          { label: 'G3: FedEx Hesapla', url: '/g3/fedex' },
          { label: 'G4: OEM Matrix', url: '/g4/oem' },
          { label: 'G5: PnL Analizi', url: '/g5/pnl' },
          { label: 'G6: Kalite Kontrol', url: '/g6/kalite' },
          { label: '🖼️ Image Processor', url: '/g6/image-processor' },
          { label: 'G7: Teknik Araçlar', url: '/g7/audit' },
        ]}
      />
    </Navigation>
  );

  return (
    <AppProvider i18n={{}}>
      <BrowserRouter>
        <Frame navigation={navMenu}>
          <Suspense fallback={<div style={{padding: '50px', textAlign: 'center'}}><Spinner accessibilityLabel="Loading" size="large" /></div>}>
            <Routes>
              <Route path="/" element={<PazaryeriPage />} />
              <Route path="/g1" element={<PazaryeriPage />} />
              <Route path="/g2/stok" element={<StokUyari />} />
              <Route path="/g2/transfer" element={<StokTransfer />} />
              <Route path="/g2/anomali" element={<FiyatAnomali />} />
              <Route path="/g2/lokal" element={<Lokalizasyon />} />
              <Route path="/g3/fedex" element={<FedexHesaplayici />} />
              <Route path="/g3/hscode" element={<HsCode />} />
              <Route path="/g3/gumruk" element={<Gumruk />} />
              <Route path="/g4/oem" element={<OemMatrix />} />
              <Route path="/g4/fitment" element={<Fitment />} />
              <Route path="/g4/kategori" element={<Kategori />} />
              <Route path="/g5/katalog" element={<KatalogAnalizi />} />
              <Route path="/g5/marka" element={<MarkaPerformansi />} />
              <Route path="/g5/siparis" element={<SiparisAnalizi />} />
              <Route path="/g5/bekleyen" element={<Bekleyen />} />
              <Route path="/g5/iade" element={<IadeAnalizi />} />
              <Route path="/g5/pnl" element={<PnL />} />
              <Route path="/g6/kalite" element={<GorselKalite />} />
              <Route path="/g6/dosya" element={<DosyaYonetici />} />
              <Route path="/g6/ceviri" element={<CeviriDurumu />} />
              <Route path="/g6/image-processor" element={<ImageProcessor />} />
              <Route path="/g7/audit" element={<MetafieldAudit />} />
              <Route path="/g7/koleksiyon" element={<BosKoleksiyon />} />
              <Route path="/g7/redirect" element={<Redirect />} />
              <Route path="/g7/graphql" element={<GraphQLTest />} />
              <Route path="/g7/discount" element={<Discount />} />
              <Route path="/g7/store-config" element={<StoreConfig />} />
            </Routes>
          </Suspense>
        </Frame>
      </BrowserRouter>
    </AppProvider>
  );
}
