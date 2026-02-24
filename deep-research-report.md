# Strong: Umfassende Funktions- und Featureanalyse in Deutsch Stand 24. Februar 2026

## Zusammenfassung

Strong positioniert sich als „Workout-Notebook neu gedacht“: Kern ist schnelles, ablenkungsfreies Trainingstracking mit historischer Vergleichbarkeit („was habe ich letztes Mal gemacht?“), kombiniert mit Cloud-Synchronisierung, Export und einem ausgereiften Apple-Watch-Workflow. citeturn12search10turn22view0turn16view0

Die **Free-Version** speichert laut App-Store-Beschreibung **unbegrenzt Workouts**, ist aber bei **selbst angelegten Routinen/Templates auf 3 beschränkt**. citeturn22view0turn2search9 Strong PRO erweitert vor allem **Planung/Analyse**: *unbegrenzte Templates, alle Charts, Warm-up-Calculator, Plate-Calculator, Körpermaße* sowie UI-Themes/Icons (iPhone). citeturn3search6turn23search10turn23search3

Wesentliche, gut dokumentierte Funktionskomplexe sind: **Workout-Logging (Sätze/Wdh./Gewicht, Timer, Supersets, Set-Tags, RPE, Notizen)**, **Vorlagen/Templates**, **Verlauf/Records/Charts**, **Messwerte (Gewicht, KFA, Kalorien; plus Body-Part-Maße in PRO)**, **Sync über Strong-Account/Strong Cloud** und **Integrationen** (insb. Apple Health, Android Health Connect in der neueren Android-Linie). citeturn4search7turn3search1turn3search0turn3search2turn4search0turn6search1turn19search12turn2search2turn6search2

Wichtige Einschränkungen/Unklarheiten:  
* Einige Features werden marketingseitig genannt (z. B. „Workout Scheduling“, „Muscle Heat Map“, „Custom Timers“), sind aber in den offiziellen Help-Center-Artikeln nicht systematisch beschrieben; Community-Threads zeigen weiterhin Verwirrung/Feature-Wünsche (z. B. Scheduling/Web UI). citeturn16view0turn20search3turn13search3turn9search7  
* Bei **Records** gibt es bewusste Grenzen (**nur bis 12 Wiederholungen** für bestimmte Record-/NRM-Logiken; 1RM-Schätzung wird bei hohen Wiederholungszahlen ungenau). citeturn2search1turn23search0  
* **Plate- und Warm-up-Calculator sind nicht auf der Apple Watch verfügbar**. citeturn23search3turn23search10  
* Android-Integration ist im Wandel: Help Center beschreibt das Ende der Google-Fit-API und den Umstieg auf Health Connect (Android 6.0 Beta), während Store-Texte teils noch Google Fit nennen. citeturn6search2turn10search6turn14view3

## Untersuchungsdesign und Quellenbasis

Diese Analyse priorisiert **offizielle, primäre Quellen**: Website strong.app, Strong Help Center (help.strongapp.io), App-Store- und Google-Play-Listings (inkl. Datensicherheits-/Privacy-Sektionen), AGB/Datenschutzerklärung sowie Troubleshooting-Artikel. citeturn16view0turn13search0turn22view0turn10search6turn15search2turn14view3turn23search6

Für „praktisches Verhalten“ (z. B. reale Pain Points) werden ergänzend **ausgewählte Reviews/Threads** genutzt, klar als Erfahrungsberichte gekennzeichnet. citeturn22view0turn9search7turn20search3

Zeitbezug: Stand **24.02.2026 (Europe/Berlin)**. Bei funktionsbezogenen Aussagen wird, wo möglich, auf aktuelle Store-Metadaten (z. B. iOS/watchOS-Mindestversionen, IAP-Preise in DE) referenziert. citeturn22view0turn10search6

## Funktionsumfang im Detail

### Workout-Flow: Start, Logging und Abschluss

Der Kern-Workflow ist im Help Center explizit beschrieben: Training wird entweder als **„Empty Workout“** gestartet oder aus einem **Template**. Danach lassen sich in der Log-Ansicht **Übungen hinzufügen**, **Reihenfolge per Drag & Drop ändern**, **Sätze hinzufügen**, **Sätze per Swipe löschen**, sowie **Gewicht und Wiederholungen** eintragen und über Checkboxen als erledigt markieren. Abschluss über „Finish“; Workouts landen danach im Verlauf (History). citeturn4search7turn2search9

Besonders praxisrelevant (und in Reviews häufig genannt) ist, dass die App während des Trainings **Vorwerte/letzte Trainingsdaten** anzeigen kann (z. B. „reps and weight last time“), was das progressive Arbeiten unterstützt, ohne dass man im Verlauf suchen muss. citeturn11search5

### Übungsbibliothek und Custom Exercises

Strong dokumentiert eine **Exercise Library mit 200+ Übungen** inklusive **Anleitungen und Videos**; Suche über Suchfeld; fehlt eine Übung, kann sie als **Custom Exercise** angelegt werden (iOS: „Exercises“ → „New“; Android: Menü → „Create Exercise“), auch direkt während eines laufenden Workouts. citeturn2search0turn8search1

Übungsverwaltung im Detail:

* **Exercise Detail Screen**: pro Übung Zugriff auf „About“ (Anleitung/Video), „History“, „Records“ sowie „Charts“ (Charts als PRO-Tab) und Editor-Funktionen (z. B. Umbenennen bei Custom Übungen, Daten übertragen). citeturn2search3  
* **Merge/Transfer von Übungsdaten**: Daten lassen sich zwischen zwei Übungen **derselben Kategorie** übertragen; der Schritt ist **nicht rückgängig** zu machen. citeturn5search1  
* **Hide Exercises**: iOS erlaubt das **Ausblenden** von Übungen (Swipe), Android „derzeit nicht verfügbar“ (Stand Artikel) – angekündigt für spätere Rückkehr. citeturn5search11  
* **Dumbbell-Zählweise (Volumenberechnung)**: iOS bietet eine Option „Count Dumbbells Twice“; Android verdoppelt Dumbbell-Gewichte automatisch. Das beeinflusst Volumen-Metriken und Chart-Interpretation. citeturn5search2  

### Satztypen, Set-Tags, RPE und strukturierte Workouts

**Set-Tags** (Warm-up, Drop Set, Failure) sind ein zentrales Subfeature:

* Tag-Auswahl über Antippen der Set-Nummer; erneutes Antippen entfernt das Tag. citeturn3search2  
* **Warm-up Sets** werden **nicht in Charts/Metriken** gezählt (wichtig für Analytics). citeturn3search2turn23search10  
* **Drop Sets** gelten als Sets „ohne Pause“. citeturn3search2  
* **Failure Sets** erlauben die Kennzeichnung eines „missed rep“ (z. B. 5 Reps + Failure = Versuch einer 6. Wiederholung). citeturn3search2  

**RPE (Rate of Perceived Exertion)** wird als Zusatzfeld pro Set unterstützt, mit einer dokumentierten Skala **6–10** und Mapping zu „Reps in Reserve“. Erfassung über das Reps-Feld und den RPE-Button; Entfernen durch erneutes Antippen. citeturn4search0

**Supersets/Circuits** sind als Übungsgruppen umgesetzt (Circuit = 3+ Übungen). Im UI werden gruppierte Übungen mit vertikaler Linie markiert; die „Next“-Navigation springt in der richtigen Reihenfolge durch die Sets der Gruppe. Anlage unterscheidet sich zwischen iOS (Mehrfachauswahl + Superset-Button) und Android (Create Superset über Menü + „chain“-Icon). citeturn3search0

### Timer-Logik: Rest Timer und weitere Timer-Elemente

Der **Rest Timer** ist offiziell detailliert beschrieben:

* Standard: **2:00 Minuten**, startet **automatisch** nach Abschluss eines Sets; Anzeige links oben. citeturn3search1  
* Manuelles Starten möglich; Full-Screen-Modus über Tap (Dauer ändern, Skip). citeturn3search1  
* Pro Übung kann die Standarddauer angepasst werden, und zwar **separat für Warm-up Sets und Work Sets**; zusätzlich globale Einstellungen (Sound/Verhalten, „Full Screen by Default“). citeturn3search1  

In der Praxis sind Timer-Änderungen/Regressions ein wiederkehrendes Thema: Deutsches App-Store-Review (2025) kritisiert u. a. veränderte Timer-Darstellung und Lesbarkeit im Workout-Screen. citeturn22view0  
Außerdem zeigen aktuelle Release Notes (App Store) Fixes rund um „Timer counts down in background“, „Timer reset after returning“ usw., was ein realistisches Bild typischer Edge Cases gibt. citeturn20search5

### Warm-up Calculator und Plate Calculator

Zwei „Lifter“-Tools sind klar als **Strong PRO** ausgewiesen:

**Warm-up Calculator (PRO)**  
* Fügt Warm-up Sets **batchweise** hinzu/aktualisiert; nur für Barbell/Dumbbell/Machine; Formeln anpassbar (iOS in Settings, Android während Workout). citeturn23search10  
* Warm-up Sets zählen nicht in Charts/Metriken. citeturn23search10turn3search2  
* Nicht verfügbar auf Apple Watch. citeturn23search10  

**Plate Calculator (PRO)**  
* Aktivierung über Weight-Feld bei Barbell/Machine; zeigt effizientste Platten pro Seite. citeturn23search3  
* Berücksichtigt Bar-Gewicht; Default: **Olympic Bar 20 kg / 45 lbs**; Bar Type pro Übung änderbar. citeturn23search3  
* Nicht verfügbar auf Apple Watch. citeturn23search3  

image_group{"layout":"carousel","aspect_ratio":"16:9","query":["Strong workout tracker app log workout screen screenshot","Strong workout tracker app exercise charts 1rm volume screenshot","Strong workout tracker Apple Watch workout logging screenshot","Strong workout tracker template routine screen screenshot"],"num_per_query":1}

### Notizen und Medien

Notizen sind dreistufig modelliert:

* **Workout Notes**: Textfeld für das gesamte Workout (und wiederverwendbar über Templates; wird beim Ausführen dupliziert). citeturn3search7  
* **Exercise Notes**: Notiz pro Übung im Workout (auch in Templates dupliziert). citeturn3search7  
* **Pinned Notes**: „Sticky“-Notizen, die bei jeder Ausführung der Übung erscheinen, aber nicht im Workout-Verlauf stehen (weil sie zur Übung gehören). citeturn3search7  

Der App-Store-Text nennt zusätzlich **„progress pictures“** (Fortschrittsfotos) zu Workouts. In den offiziellen Help-Center-Artikeln ist die Spezifik **(pro Workout vs. pro Set)** nicht weiter ausdokumentiert; daher bleibt offen, ob Medien wirklich „pro Set“ unterstützt werden oder nur auf Workout-/Übungsebene. citeturn22view0turn3search7

### Templates, Routinen und „Programme“

In Strong heißen wiederverwendbare Routinen **Templates** (früher „Routine“). Wichtig: Templates sind **kein** historisches Workout; Sets können nicht „abgehakt“ werden, es gibt keinen Zeitstempel, und beim Bearbeiten eines Templates ist der Rest-Timer nicht aktiv. citeturn2search9

Template-Erstellung und Pflege:

* **Neu anlegen**: im „Start Workout“-Bereich über „+ Template“ (bzw. im Kontext eines Ordners). citeturn2search9  
* **Aus Workout speichern**: nach Abschluss eines „Empty Workout“ wird man zum Speichern als Template aufgefordert; alternativ aus History. citeturn1search29turn2search9  
* **Beim Ausführen Template aktualisieren**: Strong kann beim Workout-Ende auffordern, das Template zu aktualisieren (für zukünftige Durchläufe). citeturn1search29  

**Free-Limit**: bis zu **3 Templates/Routinen**; **PRO**: unbegrenzt. citeturn2search9turn22view0turn3search6

Sharing als „Programmbaustein“:

* Workouts/Templates können über systemweite Share Sheets geteilt werden; Empfänger importieren per Link (App muss installiert sein). citeturn23search7  
* Für Sharing ist ein Strong Account erforderlich. citeturn19search12turn5search6  

### Historie, Editieren und „nachträglich loggen“

Strong erlaubt das nachträgliche Pflegen der Daten:

* **Vergangene Workouts editieren** (iOS/Android Schrittfolgen). citeturn4search4  
* **Datum/Start-Endzeit anpassen** (auch zur Eingabe eines „Past Workout“; „Automatic Timing“ deaktivierbar). citeturn4search2  
* „History reset“ ist nicht als echtes Löschen vorgesehen; stattdessen kann ein **Startdatum für die Historienanzeige** gesetzt werden (Daten bleiben „safe in Strong“). citeturn19search13turn12search10  

## Analyse und Metriken

### Exercise Detail, Charts und Records

Die Exercise Detail Screen ist das „Analysezentrum“ pro Übung: History (alle Workouts mit dieser Übung), Records, und Charts. Die **Charts** sind offiziell als **Strong PRO only** markiert. citeturn2search3turn3search6

Die **Records Screen** ist konzeptionell wichtig: sie zeigt „real world best performances“ plus „predicted/theoretical best“ pro Wiederholungszahl und begrenzt Records auf **≤ 12 Reps**, weil hohe Reps zu aufgeblähten NRM-Werten führen können. citeturn2search1

### 1RM, Volumen und Trenddarstellungen

Strong definiert 1RM als Schätzung der bestmöglichen Einzelwiederholung; als Formel wird die **Brzycki-Formel** genannt, und es wird explizit darauf hingewiesen, dass 1RM-Schätzungen bei **> 12 Wiederholungen** stark an Genauigkeit verlieren. citeturn23search0

Der App-Store-Text beschreibt „Advanced Statistics“, die u. a. **PRs/Progression**, **berechnete 1RM** und **Total Weight Lifted** umfassen, sowie Graphen für **Volume** und **1RM Progression**. citeturn22view0turn10search6

Ein Detail mit hoher Auswirkung auf Analytics: Warm-up Sets fließen nicht in Charts/Metriken ein. citeturn3search2turn23search10

### Focus Metric: „Live“-Vergleich im Workout

„Focus Metric“ wird als Feature beschrieben, mit dem pro Übung ein Zielindikator ausgewählt und **mit dem letzten Training dieser Übung** verglichen wird (z. B. Total Volume absolut oder als Prozentänderung; alternativ Reps, Time, Distance). Das gilt für iPhone und die „upcoming Android 6.0 version“; nicht auf Apple Watch. citeturn4search1

### Profile Widgets und Messwerte

Profile Widgets sind ein in-app Dashboard:

* Widgets per „+ Widget“ hinzufügen, umsortieren, entfernen. citeturn6search0  
* „Workouts per Week“ (mit Wochenziel); auf iPhone auch als **Home-Screen-Widget** nutzbar. citeturn6search0  
* Kalorien/Makros sind über Apple Health oder Android-Integrationen nutzbar und werden als Widgets visualisiert. citeturn6search0turn6search6  
* „Exercise und Measurement Charts“ können als Widgets hinzugefügt werden; für Übungen auch direkt aus der Exercise Detail Screen („Add to Profile“). citeturn6search0turn2search3  

Messwerte:

* Core: **Weight**, **Body Fat %**, **Caloric Intake**; teils syncbar (Apple Health). citeturn6search1turn2search2  
* **Body Measurements** (z. B. Hals, Brust, Taille, Oberschenkel etc.) sind explizit **Strong PRO**. citeturn6search1turn3search6  

## Sync, Integrationen und Plattformen

### Plattformverfügbarkeit und Mindestanforderungen

Laut Website ist Strong auf **iPhone, Android und Apple Watch** verfügbar. citeturn16view0  
Im deutschen App-Store-Eintrag (Deutschland) sind die Mindestanforderungen **iOS 15.0+** und **watchOS 10.0+** genannt; zudem werden als unterstützte UI-Sprachen u. a. **Deutsch** und insgesamt 11 Sprachen ausgewiesen. citeturn22view0

**Unterstützte App-Sprachen (App Store DE):** Englisch, Französisch, Deutsch, Italienisch, Japanisch, Koreanisch, Portugiesisch, Russisch, Chinesisch (vereinfacht), Spanisch, Chinesisch (traditionell). citeturn22view0

### Strong Account, Strong Cloud und Sync-Verhalten

Ein Strong Account dient als Fundament für Strong Cloud: Workouts sollen dadurch geräteübergreifend verfügbar bleiben (Beispiel ausdrücklich: iPhone ↔ Android). Wichtig: iOS-Nutzer:innen werden gewarnt, die App nicht zu löschen/neu zu installieren, wenn noch kein Account erstellt wurde, da Daten dann zwar lokal existieren, aber nicht in der Cloud gesichert sind. citeturn19search12turn5search6

Sync-Mechanik/Bedienung:

* Workouts synchronisieren „im Hintergrund“ oder beim Abschluss; „Force Sync“ ist möglich (iPhone: Pull-to-refresh in History; Android: Force Sync Button). citeturn7search1  
* Bei „Session Expired“ wird ausdrücklich davor gewarnt, auszuloggen oder zu löschen; stattdessen reauthentifizieren. citeturn19search15turn7search1  

**Offline-Nutzung:** Eine explizite „Offline Mode“-Spezifikation wird in den offiziellen Strong-Dokumenten nicht als Featureartikel geführt. Allerdings sprechen mehrere Indizien dafür, dass Workouts lokal erfasst und später synchronisiert werden: (a) Warnung, dass Daten ohne Account noch nicht „synced“ sind (lokale Datenbasis), (b) Sync „im Hintergrund“ und „Force Sync“, (c) Watch-Sync-Guides, die nahelegen, dass schlechte Verbindung problematischer sein kann als gar keine. Das bleibt dennoch eine **abgeleitete Interpretation** und sollte bei kritischen Workouts durch Account + Sync/Export abgesichert werden. citeturn19search12turn7search1turn2search6

### Datenexport und Backup-Formate

Export ist offiziell als **CSV** dokumentiert, „spreadsheet friendly“, und klar eingeschränkt: **Exportdateien können nicht wieder importiert werden**. citeturn23search1  
Die Datenschutzerklärung ergänzt: Export der „Workout Data“ als `.csv` ist möglich; für Export der gesamten „Personal Data“ inkl. Settings soll man aus der App heraus den Support kontaktieren. citeturn14view3

Zusätzlich zu CSV gibt es „Share Links“ für einzelne Workouts/Templates. citeturn23search1turn23search7

### Integrationen: Apple Health, Apple Watch, Android Health Connect

**Apple Health**  
Strong beschreibt „full sync“ mit Apple Health: Ernährung rein/raus, Gewicht/KFA in Strong, Workouts extern sichtbar (inkl. Activity Rings bei Apple Watch). Aktivierung über Profile/Settings → App Integrations → Apple Health; volle Berechtigungen werden empfohlen. citeturn2search2  
Troubleshooting weist auf zwei Ebenen hin: „Connected“ in Strong + System-Permissions in iOS; außerdem kein retroaktives Nachtragen alter Workouts und ein „Add Missing Workouts“-Tool (mit Duplikat-Risiko). citeturn2search4

**Apple Watch**  
App-Store-Beschreibung: „Fully-featured Apple Watch app to log workouts with or without your iPhone“. citeturn22view0  
Help Center konkretisiert die Watch-UI: Set Screen mit Weight/Reps-Edit über Digital Crown, Heart Rate im Header; Live Sync spiegelt Aktionen zwischen iPhone und Watch in Echtzeit und trackt HR während des Workouts (mit höherem Akkuverbrauch). citeturn1search30turn2search10  
Bekannte Problemklasse: Sync-Stabilität/„Duplicate Workouts“ bei Verbindungsabbrüchen/geringen Ressourcen; als Workaround wird u. a. empfohlen, Workouts auf der Watch zu beenden bzw. bei anhaltenden Duplikaten auf iPhone-only umzusteigen. citeturn8search4

**Android: Google Fit → Health Connect**  
Das Help Center beschreibt den Strukturbruch: entity["company","Google","technology company"] habe Google Fit API deprecates; Strong 2.x könne Google Fit nicht mehr unterstützen; Strong 6.0 (Android) unterstütze Health Connect (öffentliches Beta), inkl. Hinweis: Kein Rollback auf die alte Version möglich, sogar plattformübergreifend (auch iPhone nach Installation von 6.0). citeturn6search2  
Die Datenschutzerklärung ergänzt: Health-Connect-Daten werden gemäß Berechtigungen gelesen/geschrieben; empfangene Daten werden **lokal** gespeichert und **nicht** auf Strong-Server hochgeladen. citeturn14view3  
Gleichzeitig nennt der Google-Play-Listingtext weiterhin „Google Fit“ (auch bei „Updated on Feb 13, 2026“), was eine Inkonsistenz zwischen Store-Text und Help-Center-Kommunikation darstellt. citeturn10search6turn6search2

### Web-App und Desktop

Offiziell wird Strong primär als Mobile-/Watch-App kommuniziert (iPhone/Android/Apple Watch). citeturn16view0  
Ein Help-Center-Artikel (2021) nennt eine „Web App“ als Teil eines künftigen Architektur-Overhauls, ohne Details/ETA. citeturn13search3  
Community-Threads bis in die letzten Jahre zeigen, dass Nutzer:innen eine Web UI weiterhin aktiv nachfragen und sie teils als fehlend wahrnehmen. citeturn9search7turn13search1turn12search2  
Daraus folgt: **Eine allgemein verfügbare, offiziell dokumentierte Web-App als Companion ist in den primären Strong-Quellen nicht nachweisbar**, auch wenn sie wiederholt angekündigt/gewünscht wurde. citeturn13search3turn16view0turn9search7

## Abomodelle, Kosten und Lizenzlogik

### Free vs. Strong PRO: Feature-Matrix

| Featurebereich | Free (laut Doku/Store) | Strong PRO (laut Doku) | Primärquellen |
|---|---|---|---|
| Workout-Logging (Sätze/Wdh./Gewicht, Supersets, Set-Tags, Rest Timer, RPE, Notizen) | Ja | Ja | citeturn4search7turn3search0turn3search2turn3search1turn4search0turn3search7turn22view0 |
| Übungsbibliothek + Custom Exercises | Ja (200+ Library + eigene Übungen) | Ja | citeturn2search0turn22view0 |
| Workout-Historie speichern | Unbegrenzt (Workouts) | Unbegrenzt | citeturn22view0turn3search6 |
| Templates/Routinen | Bis 3 Templates/Routinen | Unbegrenzt | citeturn2search9turn22view0turn3search6 |
| Charts (pro Übung) | Eingeschränkt (Charts-Tab als PRO) | „Access to all Charts“ | citeturn2search3turn3search6 |
| Warm-up Calculator | Nein | Ja (PRO) | citeturn23search10turn3search6 |
| Plate Calculator | Nein | Ja (PRO) | citeturn23search3turn3search6 |
| Messwerte | Core (Gewicht, KFA, Kalorien) | zusätzlich Body-Part-Messungen | citeturn6search1turn3search6 |
| UI-Extras | Standard | Themes + Custom Icons (iPhone) | citeturn3search6 |

Wichtig: Strong betont, dass Workout-Daten auch ohne PRO zugänglich bleiben („nie locked out“); PRO ist Funktions-Upgrade, kein „Datenzugangs-Abo“. citeturn3search6

### Preise und Kaufmodelle

Im deutschen App-Store-Eintrag werden mehrere In-App-Purchase-Optionen angezeigt, darunter Monats-/Jahresabos und „Strong PRO Forever“ (Einmalkauf). Beispiele aus dem DE-Store-Screenshottext: *Strong PRO (1 Month) 5,99 €*, *Strong PRO (1 Month) 4,99 €* sowie *Strong PRO Forever 99,99 €* (und weitere regionale/Legacy-Preiszeilen). citeturn22view0  
Der Beschreibungstext nennt als US-Preisanker **$4.99/Monat** oder **$29.99/Jahr**. citeturn22view0

AGB/Definition „Forever“: „Strong PRO Forever“ bedeutet ausdrücklich **Lebensdauer des Dienstes**, nicht Lebensdauer der Nutzer:innen; keine Garantie auf zukünftigen Zugang, auch wenn eine „continued operation“ angestrebt wird. citeturn15search2

Kündigung/Verwaltung: Offizielle Hilfeseiten erklären Abbruch über App-Store-/Play-Store-Subscription-Management; Upgrade/Wechsel der Zahlungsoptionen in-app; „Restore Purchases“ als Troubleshooting-Pfad. citeturn19search8turn19search9turn19search6

## Datenschutz, Sicherheit, Accessibility und bekannte Einschränkungen

### Datenschutz und Datenverarbeitung

Die Datenschutzerklärung (Strong Fitness PTE Ltd.) beschreibt:

* Accountdaten: Name optional, E-Mail erforderlich; Login auch über „Sign in with Apple“ oder Facebook; bei Verlust des Logins kann Accountzugang verloren gehen, E-Mail wird aus Sicherheitsgründen nicht wiederhergestellt/geändert. citeturn14view3turn13search6turn19search0  
* Workout-Daten gelten als „your data“; CSV-Export möglich; kompletter Export inkl. Settings über Support. citeturn14view3turn23search1  
* Analytics: Website-Traffic via entity["company","Fathom Analytics","web analytics service"], Bug Tracking via entity["company","Sentry","application monitoring service"]; laut Erklärung werden keine persönlichen Informationen an diese Dienste gesendet. citeturn14view3  
* Serverstandort: Verarbeitung/Storage in den USA und anderen Ländern; Daten werden „indefinitely“ vorgehalten, solange für Services nötig; Löschung bei Account-Close möglich. citeturn14view3  
* Health Connect: Daten lokal, nicht Upload auf Strong-Server. citeturn14view3  
* Account-Löschung in-app (Profile → Delete Strong Account) löscht Account + zugehörige Daten. citeturn14view3turn23search9  

Google Play „Data safety“ ergänzt (für Android): „No data shared with third parties“, „Data is encrypted in transit“, „You can request that data be deleted“, sowie Kategorien potenziell erhobener Daten (u. a. Personal info, Health and fitness). citeturn10search6

### Accessibility

In den offiziellen Strong-Quellen (Help Center/Store-Text) existiert **keine dedizierte, ausformulierte Accessibility-Funktionsliste** (z. B. VoiceOver/TalkBack-Optimierungen, dynamische Schriftgrößen, Kontrastmodi). Damit lässt sich Accessibility derzeit nur indirekt über die generellen OS-Funktionen erwarten; eine verifizierte Aussage „Strong ist vollständig screenreader-optimiert“ wäre spekulativ. citeturn13search0turn22view0  
Praktisch ist immerhin: iOS-Integration über Siri ist ausgewiesen (impliziert Shortcuts/Voice-Trigger in irgendeiner Form). citeturn22view0

### Bekannte Einschränkungen, Edge Cases und wiederkehrende Bugs

Mehrere offiziell dokumentierte Limitierungen/Problemklassen:

* **Records/1RM-Genauigkeit**: Records-Logik beschränkt sich auf Sets ≤12 Reps; 1RM-Schätzer wird bei >12 Reps unzuverlässig. citeturn2search1turn23search0  
* **Charts nicht updating** (iOS PRO): Reload Charts über Settings → Help & Support → Reload Charts. citeturn23search2  
* **Android vs iOS Feature-Divergenzen**: Hide Exercises ist laut Help Center auf Android (Stand Artikel) nicht verfügbar. citeturn5search11  
* **Watch-spezifische Stabilität**: Live Sync erhöht Akkuverbrauch; Apple-Watch-Sync hängt von iOS/watchOS-Versionen, Hardware-Generation und Netzwerkqualität ab. citeturn2search10turn2search6  
* **Duplicate Workouts (Apple Watch)**: treten u. a. bei instabiler Verbindung/Resource-Constraints auf; Workaround kann iPhone-only sein. citeturn8search4  
* **Timer-Fehlerbilder** (aktuelle Release Notes): Beispiele sind „Timer zählt im Hintergrund nicht runter“ oder „Timer reset nach App-Wechsel“, die als Fixes in jüngeren Versionen auftauchen. citeturn20search5  
* **Export ist Einbahnstraße**: CSV kann nicht re-importiert werden; Löschen eines Accounts bedeutet irreversiblen Verlust der Historie (außer extern gesichert). citeturn23search1turn23search9  
* **Mehrere Accounts/kein Merge**: Nutzung verschiedener Login-Methoden kann zu getrennten Accounts führen; Help Center sagt explizit, dass Daten zwischen Accounts nicht zusammengeführt werden können. citeturn19search12turn13search6  

„Bekannte Lücken“ aus Nutzerperspektive (nicht als harte Fakten, sondern als Signal):

* Wiederkehrender Wunsch nach **Web UI** und leichterer Template-Pflege am Desktop taucht in Community-Threads auf. citeturn9search7turn13search1  
* Fragen, ob **Workout Scheduling** überhaupt existiert bzw. wie man es nutzt, deuten darauf hin, dass die Funktion (falls vorhanden) nicht prominent/selbsterklärend ist oder nicht flächendeckend ausgerollt wurde. citeturn20search3turn16view0  

## Vergleich und Einordnung

Strong ist am ehesten ein **spezialisiertes Strength-Logging-System** (Notebook-Ersatz + Analytics + Watch/Health-Integrationen), weniger ein „Coach“- oder „Content“-Programm.

Kurzer Kontext zu ähnlichen Apps:

* entity["company","Hevy","workout tracker app"]: positioniert sich als Workout-Tracker mit Community-Fokus („track progress with friends“), Routines/Library/Custom Exercises und eigener Feature-Seite, die u. a. Widgets und zusätzliche „Settings & Extra Features“ listet. citeturn24search0turn24search8  
* entity["company","Fitbod","strength training app"]: klarer Schwerpunkt auf **personalisierten, algorithmisch generierten Workouts** („fully customized workouts based on goals, equipment“; „proprietary algorithm“/AI-Personalisierung). Das ist ein anderer Produktansatz als Strong (Planung/Progression stärker nutzergetrieben über Templates). citeturn24search1turn24search5  
* entity["company","JEFIT","workout planner app"]: betont eine große Übungs-/Routinen-Datenbank („workout routine database“) sowie Planung/Tracker-Funktionen und umfangreiche Exercise-DB (App/Website/Play Store). citeturn24search2turn24search6turn24search10  
* entity["company","GymBook","workout log app"]: stärker iOS-zentriert, betont Apple Watch Logging und Health-App-Integration; beschreibt außerdem (im App-Store-Text) UI-Elemente wie Heatmaps/Live Activities – also mehr „Apple-Ökosystem“-Spezialfunktionen. citeturn24search3turn24search7  

Einordnung: Strong ist besonders stark, wenn man **schnell loggen**, **Templates flexibel anpassen**, **über Watch und Health-Dienste konsolidieren** und **Daten exportieren** will. citeturn22view0turn23search1turn2search10turn2search2  
Wenn man dagegen **automatische Programmplanung/AI-Coaching** sucht, sind Apps mit algorithmischem Ansatz (Fitbod) konzeptionell näher. citeturn24search1turn24search5  
Wer eine **Web/ ডেস্কটоп-Planungsoberfläche** als Muss-Kriterium hat, findet in der Strong-Dokumentation keinen belastbaren Nachweis einer derzeit verfügbaren Web UI; das bleibt ein bekanntes Wunsch-/Roadmap-Thema. citeturn13search3turn9search7turn12search2