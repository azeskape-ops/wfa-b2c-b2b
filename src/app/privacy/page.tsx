import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#f8fafc] py-10 px-4 font-sans text-[#1e293b]">
      <div className="max-w-3xl mx-auto bg-white rounded-[28px] shadow-[0_15px_40px_rgba(0,86,179,0.1)] p-8 md:p-12">
        
        {/* Шапка с логотипом и кнопкой назад */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src="https://i.ibb.co/PvRd3TkP/logo-blue.png" 
            alt="Work For All" 
            className="w-[180px] mb-6 object-contain"
          />
          <Link 
            href="/" 
            className="text-[#0056b3] hover:underline font-semibold mb-6 flex items-center gap-2"
          >
            <span>← Назад до анкети</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">
            Informačné memorandum o spracúvaní osobných údajov (GDPR)
          </h1>
          <p className="text-gray-600 text-center text-sm md:text-base">
            V súlade s Nariadením Európskeho parlamentu a Rady (EÚ) 2016/679 (GDPR) a zákonom č. 18/2018 Z. z. o ochrane osobných údajov vás informujeme o podmienkach spracúvania vašich osobných údajov.
          </p>
        </div>

        {/* Основной текст */}
        <div className="space-y-6 text-gray-700 leading-relaxed text-sm md:text-base">
          
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Prevádzkovateľ (Kto spracúva vaše údaje)</h2>
            <ul className="list-none space-y-1">
              <li><strong>Názov spoločnosti:</strong> Work for all s.r.o.</li>
              <li><strong>Sídlo:</strong> Sládkovičova 27/A, 974 01 Banská Bystrica</li>
              <li><strong>IČO:</strong> 54 242 801</li>
              <li><strong>Registrácia:</strong> Obchodný register Okresného súdu Banská Bystrica, Oddiel: Sro, vložka č. 42568/S</li>
              <li><strong>Kontakt:</strong> <a href="mailto:info@workforall.sk" className="text-[#0056b3] hover:underline">info@workforall.sk</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Účel a právny základ spracúvania</h2>
            <p className="mb-2">Vaše osobné údaje spracúvame na tieto účely:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Sprostredkovanie zamestnania:</strong> Evidencia uchádzačov o zamestnanie, kontaktovanie s pracovnými ponukami (Právny základ: Súhlas dotknutej osoby alebo predzmluvné vzťahy).</li>
              <li><strong>Vybavovanie pobytov a víz:</strong> Príprava podkladov pre cudzineckú políciu a úrady práce za účelom získania prechodného pobytu alebo víz (Právny základ: Plnenie zmluvy).</li>
              <li><strong>Komunikácia:</strong> Odpovedanie na vaše dopyty cez kontaktné formuláre (Právny základ: Oprávnený záujem).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Rozsah spracúvaných údajov</h2>
            <p>Spracúvame len nevyhnutné údaje, najmä: meno, priezvisko, telefónne číslo, e-mail, mesto pobytu, informácie o štátnej príslušnosti a statuse pobytu (napr. dočasné útočisko, bezvízový styk).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Príjemcovia údajov</h2>
            <p className="mb-2">Vaše údaje môžu byť poskytnuté:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Potenciálnym zamestnávateľom (len s vaším vedomím).</li>
              <li>Úradom (Cudzinecká polícia, Úrad práce), ak je to nutné pre vybavenie pobytu.</li>
              <li>Poskytovateľom IT služieb (napr. Google, hosting), ktorí zabezpečujú chod našich systémov.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Doba uchovávania</h2>
            <p>Osobné údaje uchovávame po dobu nevyhnutnú na splnenie účelu (napr. počas trvania vízového procesu) alebo po dobu 3 rokov od udelenia súhlasu v našej databáze uchádzačov, pokiaľ súhlas neodvoláte skôr.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Vaše práva</h2>
            <p className="mb-2">Ako dotknutá osoba máte právo:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Požadovať prístup k svojim údajom.</li>
              <li>Požadovať opravu nepresných údajov.</li>
              <li>Požadovať vymazanie údajov ("právo na zabudnutie"), ak pominul účel spracúvania.</li>
            </ul>
          </section>

        </div>
        
        <div className="mt-10 text-center">
          <Link 
            href="/" 
            className="inline-block bg-[#0056b3] text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-800 transition-colors"
          >
            Зрозуміло, повернутися
          </Link>
        </div>

      </div>
    </div>
  );
}