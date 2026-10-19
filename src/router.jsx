import { createBrowserRouter } from 'react-router'
import { SiteLayout } from './components/layout/SiteLayout.jsx'
import { DemoTixLayout } from './components/demotix/DemoTixLayout.jsx'
import { AdminLayout } from './components/demo/AdminLayout.jsx'
import { RootLayout } from './components/demo/RootLayout.jsx'
import { RequireLogin } from './components/RequireLogin.jsx'
import Home from './pages/site/Home.jsx'
import Login from './pages/site/Login.jsx'
import SellTicket from './pages/site/SellTicket.jsx'
import MyListings from './pages/site/MyListings.jsx'
import EventPage from './pages/site/EventPage.jsx'
import Checkout, { CheckoutStart } from './pages/site/Checkout.jsx'
import Swap from './pages/site/Swap.jsx'
import Waitlist from './pages/site/Waitlist.jsx'
import Inbox from './pages/site/Inbox.jsx'
import NotFound from './pages/NotFound.jsx'
import HowItWorks from './pages/site/HowItWorks.jsx'
import BoxOffice from './pages/demotix/BoxOffice.jsx'
import BoxOfficeBuy from './pages/demotix/BoxOfficeBuy.jsx'
import TicketDatabase from './pages/demotix/TicketDatabase.jsx'
import ApiLog from './pages/demotix/ApiLog.jsx'
import PartnerRevenue from './pages/demotix/PartnerRevenue.jsx'
import OtherWay from './pages/OtherWay.jsx'

const loggedIn = (page) => <RequireLogin>{page}</RequireLogin>

// Screens opened now and then (and the heavy QR libraries) load only when first visited,
// so the site itself opens fast, also on a phone.
const later = (load, wrap = (Page) => <Page />) => ({
  lazy: async () => {
    const Page = (await load()).default
    return { element: wrap(Page) }
  },
})

// Every screen gets its own address, so any part of the demo can be opened directly.
export const router = createBrowserRouter([
  {
    // Every screen, plus the presenter's Demo button.
    element: <RootLayout />,
    children: [
      // Presenting: the opening story, the split screen, and the admin's controls.
      { path: '/other-way', element: <OtherWay /> },
      { path: '/present', ...later(() => import('./pages/Present.jsx')) },
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, ...later(() => import('./pages/admin/DemoControl.jsx')) },
          { path: 'settings', ...later(() => import('./pages/admin/Settings.jsx')) },
        ],
      },

      // The gate scanner: a full-screen steward's tool at the venue, run by the ticketing company.
      { path: '/scanner', ...later(() => import('./pages/scanner/Scanner.jsx')) },
      // FixTix's dashboard for the ticketing company.
      { path: '/partner', ...later(() => import('./pages/partner/PartnerDashboard.jsx')) },

      {
        // DemoTix: the mock ticketing company
        path: '/demotix',
        element: <DemoTixLayout />,
        children: [
          { index: true, element: <BoxOffice /> },
          { path: 'buy/:eventId', element: <BoxOfficeBuy /> },
          { path: 'database', element: <TicketDatabase /> },
          { path: 'api-log', element: <ApiLog /> },
          { path: 'revenue', element: <PartnerRevenue /> },
          {
            path: '*',
            element: (
              <div className="flex-1 bg-white text-ink">
                <NotFound />
              </div>
            ),
          },
        ],
      },

      {
        // FixTix: what buyers and sellers see
        path: '/',
        element: <SiteLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: 'event/:eventId', element: <EventPage /> },
          { path: 'how-it-works', element: <HowItWorks /> },
          { path: 'login', element: <Login /> },
          { path: 'checkout', element: loggedIn(<CheckoutStart />) },
          { path: 'checkout/:orderId', element: loggedIn(<Checkout />) },
          { path: 'swap/:orderId', element: loggedIn(<Swap />) },
          { path: 'my-tickets', ...later(() => import('./pages/site/MyTickets.jsx'), (Page) => loggedIn(<Page />)) },
          { path: 'waitlist', element: loggedIn(<Waitlist />) },
          { path: 'inbox', element: loggedIn(<Inbox />) },
          { path: 'sell', element: loggedIn(<SellTicket />) },
          { path: 'my-listings', element: loggedIn(<MyListings />) },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
])
