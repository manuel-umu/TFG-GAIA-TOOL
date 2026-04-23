<template>
  <section class="custom-section">
    <div>
      <Header
        title="Audit reports"
        :perPage="perPage"
        :showAdd="false"
        :showActions="false"
        :tooltip="'report'"
        @update:perPage="perPage = $event"
      />
      <Table
        :data="allAudits"
        :columns="columns"
        :actions="rowActions"
        :checkable="false"
        @report-ahp="exportAhpPDF"
        @report-csrd="exportCsrdPDF"
      />
      <Pagination
        class="custom-pagination"
        :total="total"
        :perPage="perPage"
        :currentPage="currentPage"
        @change="onPageChange"
      />
    </div>
  </section>
</template>

<script>
import Header from '@/components/Header.vue';
import Table from '@/components/Table.vue';
import Pagination from '@/components/Pagination.vue';
import axiosInstance from '@/services/axiosInstance';
import jsPDF from 'jspdf';
import autoTableModule from 'jspdf-autotable';
const autoTable = autoTableModule.default || autoTableModule;
import logo from '@/assets/images/logo.png';


export default {
  name: 'ReportsView',
  components: {
    Header,
    Table,
    Pagination,
  },
  data() {
    return {
      userRole: localStorage.getItem('role'),
      userId: null,

      allAudits: [],
      isLoading: false,

      name: null,
      description: null,
      auditor: null,
      manager: null,
      init_date: null,
      end_date: null,
      frequency: null,
      state: null,
      organization: null,
      coefficient: null,

      allUsers: [],
      organizations: [],
      indexProcesses: [],
      resultsIndicators: [],
      processesAudit: [],

      total: 1,
      page: 1,
      perPage: 5,
      currentPage: 1,
      sortField: "id",
      sortOrder: "asc",

      columns: [
        { field: 'id', label: 'ID', sortable: true, render: row => `A${row.id}` },
        { field: 'name', label: 'Name', sortable: true },
        { field: 'organization', label: 'Organization' },
        { field: 'auditor', label: 'Evaluator auditor'},
        { field: 'manager', label: 'Manager' },
        { field: 'init_date', label: 'Init date', sortable: true },
        { field: 'end_date', label: 'End date', sortable: true },
        { field: 'framework_code', label: 'Normativa', render: row => row.framework_code || '-' },
        { field: 'state', label: 'State', sortable: true  },
      ],
    }
  },
  watch: {
    perPage: async function() {
      await this.getAudits();
    },
  },
  computed: {
    rowActions() {
      return [
        {
          icon: 'mdi mdi-file-chart-outline',
          event: 'report-ahp',
          disabledCondition: (row) => row.state === 'Not evaluated',
          if: (row) => !row.framework_code,
        },
        {
          icon: 'mdi mdi-leaf',
          event: 'report-csrd',
          if: (row) => !!row.framework_code,
        },
      ];
    },
  },
  mounted: async function() {
    this.userId = localStorage.getItem('id');
    await this.getAudits();
    await this.getUsers();
    await this.getOrganizations();
  },
  methods: {
    onPageChange: async function(page) {
      this.page = page;
      await this.getAudits();
    },
    getOrganizations: async function () {
        try {
            const response = await axiosInstance.get('/organizations', {
              params: {
                page: 1,
                perPage: 10000,
                sortBy: this.sortField,
                sortOrder: this.sortOrder,
              }
            });
            this.organizations = response.data?.data;;
        } catch (error) {
            console.log(error);
        }
    },
    getAudit: async function (id) {
      try {
          this.isLoading = true;
          this.indexProcesses = [];
          this.resultsIndicators = [];
          this.processesAudit = [];
          const response = await axiosInstance.get(`/audits/${id}`);
          const audit = response.data?.audit;
          const results = response.data?.results;
          await this.getDetailsAudit(audit);
          await this.getResultsAudit(results);
          this.isLoading = false;
      } catch (error) {
          console.log(error);
          this.isLoading = false;
      }
    },
    getDetailsAudit: async function (audit) {
      try {
        this.name = audit.name;
        this.description = audit.description;
        this.auditor = audit.auditor;
        this.manager = audit.manager;
        this.init_date = audit.init_date;
        this.end_date = audit.end_date;
        this.frequency = audit.frequency;
        this.state = audit.state;
        var org = this.organizations.find(o => o.id == audit.organization);
        this.organization = org.name;
        await this.getProcesesProperties(audit.processes);
        await this.getIndicatorsProcess(audit.processes);
      } catch (error) {
          console.log(error);
      }
    },
    getProcesesProperties: async function (processes) {
        this.isLoading = true;
        const procWithProps = [];
        for (const p of processes) {
            try {
                const response = await axiosInstance.get(`/processes/${p}`)
                var processData = response.data;
                const existing = this.processesAudit.find(pr => Number(pr.id) === Number(p));
                const procObj = existing ? { ...existing, name: processData.name } : { id: p, name: processData.name, indicators: [] };
                procWithProps.push(procObj);
            } catch (error) {
                console.log(error);
            }
        }
        this.processesAudit = procWithProps;
        this.isLoading = false;
    },
    getIndicatorsProcess: async function (processes) {
        this.isLoading = true;
        for (const p of processes) {
            try {
                const response = await axiosInstance.get(`/processes/${p}/indicators`);
                const indicators = response.data;

                const existingProcess = this.processesAudit.find(
                    pr => Number(pr.id) === Number(p)
                );

                if (existingProcess) {
                    existingProcess.indicators = indicators;
                } else {
                    this.processesAudit.push({ id: p, indicators });
                }

            } catch (error) {
                console.log(error);
            }
        }
        this.isLoading = false;
    },
    getResultsAudit: async function (results) {
      this.coefficient = Number(results.coefficient);
      for (const p of results.processes) {
        this.indexProcesses.push({
          name: this.processesAudit.find(pr => Number(pr.id) === Number(p.process))?.name || '',
          index: Number(p.sustainability_index),
        });
        p.indicators.forEach(ind => {
          this.resultsIndicators.push({
            id: ind.id,
            real_value: ind.real_value,
            ideal_value: ind.ideal_value,
            normalized_value: ind.normalized_value,
          })
        });
      }
    },
    getAudits: async function () {
      try {
          const response = await axiosInstance.get(`/audits?states=Closed,Not evaluated`, {
            params: {
              page: this.page,
              perPage: this.perPage,
              sortBy: this.sortField,
              sortOrder: this.sortOrder,
            }
          });
          this.allAudits = response.data?.data;
          this.currentPage = response.data?.currentPage;
          this.total = response.data?.total;
      } catch (error) {
          console.log(error);
          this.handleErrors(error);
      }
    },
    showError: function (error) {
        this.$buefy.snackbar.open({
            message: error,
            type: 'is-danger',
            duration: 5000,
        });
    },
    getUsers: async function () {
        try {
            const response = await axiosInstance.get('/users');
            this.allUsers = response.data;
        } catch (error) {
            error = true;
        }
    },
    getNameUser(userId) {
        const user = this.allUsers.find(u => u.id === parseInt(userId));
        return user ? user.name : userId;
    },
    cargarLogo: async function () {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = logo;

            img.onload = () => resolve(img);
            img.onerror = (err) => {
            console.error("Error cargando logo:", err);
            resolve(null);
            };
        });
    },
    async exportAhpPDF(row) {
      await this.getAudit(row.id);
      const doc = new jsPDF('p', 'pt');

      const logo = await this.cargarLogo();
      if (logo) {
        doc.addImage(logo, "PNG", 30, 15, 110, 70);
      }

      // --- HEADER ---
      doc.setFontSize(19);
      doc.setFont("times", "bold");
      doc.setTextColor("#98A869");
      doc.text("SUSTAINABILITY AUDIT REPORT", 150, 70);
      doc.setTextColor("#000000");
      doc.line(40, 100, 555, 100);

      // --- INTRO ---
      let y = 125;
      doc.setFont("times", "normal");
      doc.setFontSize(12);

      const reportText = `This report presents the results of the sustainability audit conducted on the organization's business processes, applying a model based on Green Business Process Management (Green BPM) and the evaluation of quantitative sustainability indicators. 
      The audit enables the assessment of process performance across multiple sustainability dimensions and the calculation of both process-level sustainability indices and the organization's overall sustainability coefficient, providing an objective basis for continuous improvement and informed decision-making.`;

      y = this.addJustifiedText(doc, reportText, 40, y, doc.internal.pageSize.getWidth() - 80, 18);
      y += 10;

      // --- INFORMACIÓN GENERAL ---
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text("1. General Audit Information", 40, y);
      y += 20;

      doc.setFont("times", "normal");
      doc.setFontSize(12);
      doc.text(`Name: ${row.name}`, 40, y); y += 18;
      if (this.description) {
        y = this.addJustifiedText(doc, `Description: ${this.description}`, 40, y, doc.internal.pageSize.getWidth() - 80, 18);
        y += 10;
      }
      doc.text(`Organization: ${this.organization}`, 40, y); y += 18;
      doc.text(`Auditor: ${this.getNameUser(row.auditor)}`, 40, y); y += 18;
      doc.text(`Manager: ${this.getNameUser(row.manager)}`, 40, y); y += 18;
      doc.text(`Init date: ${row.init_date ? row.init_date.split('T')[0].split('-').reverse().join('-') : ''}`, 40, y); y += 18;
      doc.text(`End date: ${row.end_date ? row.end_date.split('T')[0].split('-').reverse().join('-') : ''}`, 40, y); y += 30;

      // --- RESULTADOS ---
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text("2. Audit Results", 40, y);
      y += 20;

      doc.setFont("times", "normal");
      doc.setFontSize(12);

      let sustainabilityLevel = "";
      if (this.coefficient >= 0.876) sustainabilityLevel = "very high";
      else if (this.coefficient >= 0.626) sustainabilityLevel = "high";
      else if (this.coefficient >= 0.376) sustainabilityLevel = "medium";
      else if (this.coefficient >= 0.126) sustainabilityLevel = "low";
      else sustainabilityLevel = "very low";

      const indicatorsIntro = `The overall sustainability coefficient obtained is ${this.coefficient.toFixed(2)}, placing the organization at a ${sustainabilityLevel} sustainability level. The following table presents the sustainability indicators for each business process.`;
      y = this.addJustifiedText(doc, indicatorsIntro, 40, y, doc.internal.pageSize.getWidth() - 80, 18);

      // --- Tabla de procesos ---
      if (this.indexProcesses && this.indexProcesses.length > 0) {
        const body = this.indexProcesses.map(proc => {
          let level = '';
          if (proc.index >= 0.876) level = "Very high";
          else if (proc.index >= 0.626) level = "High";
          else if (proc.index >= 0.376) level = "Medium";
          else if (proc.index >= 0.126) level = "Low";
          else level = "Very low";
          return [proc.name, proc.index.toFixed(2), level];
        });

        autoTable(doc, {
          startY: y,
          head: [["Process Name", "Process Sustainability Index", "Level of Sustainability"]],
          body,
          theme: 'grid',
          headStyles: { fillColor: [152,168,105], textColor: 0, fontStyle: 'bold' },
          styles: { font: "times", fontSize: 12 },
          margin: { left: 40, right: 40 },
        });

        y = doc.lastAutoTable.finalY + 10;
      }

      y+=20;

      const indicatorsDetailIntro = `This section presents a breakdown of the sustainability indicators included in each business process, structured by sustainability dimension.`;

      y = this.addJustifiedText(
        doc,
        indicatorsDetailIntro,
        40,
        y,
        doc.internal.pageSize.getWidth() - 80,
        18
      );

      y+=5;

      this.processesAudit.forEach(process => {

        if (y>800) {
          doc.addPage();
          y=50;
        }

        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.text(`Business Process: ${process.name}.`, 40, y);
        y += 20;

        // 🔹 Combinar indicadores con resultados
        const combinedIndicators = process.indicators.map(ind => {
          const result = this.resultsIndicators.find(r => r.id === ind.id) || {};
          return {
            id: ind.id,
            name: ind.name,
            dimension: ind.dimension,
            measure: ind.measure,
            ideal_value: result.ideal_value || "-",
            real_value: result.real_value || "-",
            normalized_value: result.normalized_value || "-",
          };
        });

        // 🔹 Agrupar por dimensión
        const indicatorsByDimension = combinedIndicators.reduce((acc, ind) => {
          if (!acc[ind.dimension]) acc[ind.dimension] = [];
          acc[ind.dimension].push(ind);
          return acc;
        }, {});

        // 🔹 Iterar dimensiones
        Object.entries(indicatorsByDimension).forEach(([dimension, indicators]) => {

          // Subtítulo de dimensión
          doc.setFont("times", "bolditalic");
          doc.setFontSize(12);
          doc.text(`${dimension.charAt(0).toUpperCase() + dimension.slice(1)} Dimension`, 40, y);
          y += 10;

         autoTable(doc, {
          startY: y,
          head: [["Indicator", "MU", "Vi", "Vr", "N"]],
          body: indicators.map(ind => [
            ind.name,
            ind.measure || "-",
            ind.ideal_value,
            ind.real_value,
            ind.normalized_value,
          ]),
          theme: "grid",
          headStyles: {
            fillColor: [214, 220, 195],
            textColor: 0,
            fontStyle: "bold"
          },
          styles: {
            font: "times",
            fontSize: 10,
            cellPadding: 3
          },
          columnStyles: {
            // Columna 0 (Indicator) ocupa el espacio restante
            0: { cellWidth: 'auto', halign: 'left', overflow: 'linebreak'},

            // Columnas 1 a 4 tienen ancho fijo y alineadas a la derecha
            1: { cellWidth: 60, halign: 'left' },
            2: { cellWidth: 35, halign: 'left' },
            3: { cellWidth: 35, halign: 'left' },
            4: { cellWidth: 35, halign: 'left' },
          },
          pageBreak: 'auto',
          margin: { left: 40, right: 40 },
        });


          // Actualizamos Y con espacio extra
          y = doc.lastAutoTable.finalY + 20; // +12 para separar tablas
        });

        // Espacio extra entre procesos
        y += 20;
      });

      doc.save("ahp-sustainability-report.pdf");
    },
    async exportCsrdPDF(row) {
      // Carga paralela de datos
      const [materiality, questionnaire, auditResp] = await Promise.all([
        axiosInstance.get(`/audits/${row.id}/materiality`),
        axiosInstance.get(`/audits/${row.id}/questionnaire`),
        axiosInstance.get(`/audits/${row.id}`),
      ]);

      const materialityStandards = materiality.data?.standards || [];
      const questionnaireStandards = questionnaire.data?.standards || [];
      const audit = auditResp.data?.audit || {};

      const doc = new jsPDF('p', 'pt');
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginL = 40;
      const marginR = 40;
      const contentWidth = pageWidth - marginL - marginR;

      // ---- CABECERA ----
      const logo = await this.cargarLogo();
      if (logo) doc.addImage(logo, 'PNG', marginL, 15, 110, 70);

      doc.setFontSize(17);
      doc.setFont('times', 'bold');
      doc.setTextColor('#98A869');
      doc.text('CSRD COMPLIANCE REPORT', 165, 65);
      doc.setTextColor('#000000');
      doc.line(marginL, 100, pageWidth - marginR, 100);

      let y = 120;

      // ---- INFORMACIÓN DE AUDITORÍA ----
      doc.setFont('times', 'bold');
      doc.setFontSize(13);
      doc.text('1. Audit Information', marginL, y);
      y += 18;

      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      const org = this.organizations.find(o => o.id == audit.organization);
      doc.text(`Name: ${row.name}`, marginL, y); y += 15;
      doc.text(`Organization: ${org?.name || '-'}`, marginL, y); y += 15;
      doc.text(`Auditor: ${this.getNameUser(row.auditor)}`, marginL, y); y += 15;
      doc.text(`Manager: ${this.getNameUser(row.manager)}`, marginL, y); y += 15;
      doc.text(`Framework: ${row.framework_code || '-'}`, marginL, y); y += 15;
      doc.text(`Period: ${row.init_date ? row.init_date.split('T')[0].split('-').reverse().join('-') : '-'} → ${row.end_date ? row.end_date.split('T')[0].split('-').reverse().join('-') : '-'}`, marginL, y);
      y += 25;

      // ---- SECCIÓN 2: MATERIALIDAD ----
      doc.setFont('times', 'bold');
      doc.setFontSize(13);
      doc.text('2. Double Materiality Assessment', marginL, y);
      y += 12;

      const matBody = materialityStandards.map(s => [
        s.code || '',
        s.name || '',
        s.category || '',
        s.is_mandatory ? 'Yes' : 'No',
        s.assessment?.is_material ? 'Material' : 'Not material',
        s.assessment?.justification ? s.assessment.justification.substring(0, 120) : '-',
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Code', 'Standard', 'Category', 'Mandatory', 'Materiality', 'Justification']],
        body: matBody,
        theme: 'grid',
        headStyles: { fillColor: [152, 168, 105], textColor: 0, fontStyle: 'bold', fontSize: 9 },
        styles: { font: 'times', fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 100 },
          2: { cellWidth: 60 },
          3: { cellWidth: 45 },
          4: { cellWidth: 55 },
          5: { cellWidth: 'auto' },
        },
        margin: { left: marginL, right: marginR },
      });

      y = doc.lastAutoTable.finalY + 25;

      // ---- SECCIÓN 3: DATAPOINTS ----
      doc.setFont('times', 'bold');
      doc.setFontSize(13);
      if (y > 720) { doc.addPage(); y = 50; }
      doc.text('3. CSRD DataPoints — Completed & Validated Responses', marginL, y);
      y += 14;

      const VALID_STATUSES = ['completed', 'validated'];

      for (const standard of questionnaireStandards) {
        // Comprobar si hay al menos un DP válido en este estándar
        const hasValidDPs = standard.disclosure_requirements?.some(dr =>
          dr.data_points?.some(dp =>
            dp.response?.is_applicable === true && VALID_STATUSES.includes(dp.response?.status)
          )
        );
        if (!hasValidDPs) continue;

        if (y > 700) { doc.addPage(); y = 50; }

        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.text(`${standard.code} — ${standard.name}`, marginL, y);
        y += 14;

        for (const dr of (standard.disclosure_requirements || [])) {
          const validDPs = (dr.data_points || []).filter(dp =>
            dp.response?.is_applicable === true && VALID_STATUSES.includes(dp.response?.status)
          );
          if (validDPs.length === 0) continue;

          if (y > 700) { doc.addPage(); y = 50; }

          doc.setFont('times', 'italic');
          doc.setFontSize(10);
          doc.text(`${dr.code} — ${dr.name}`, marginL + 10, y);
          y += 10;

          const dpBody = validDPs.map(dp => {
            let value = '-';
            if (dp.data_type === 'boolean') {
              value = dp.response.value_text != null ? (dp.response.value_text === 'true' || dp.response.value_text === true ? 'Yes' : 'No') : '-';
            } else if (dp.data_type === 'narrative') {
              const raw = dp.response.value_text || '-';
              value = raw.length > 200 ? raw.substring(0, 200) + '…' : raw;
            } else {
              value = dp.response.value_numeric != null ? String(dp.response.value_numeric) + (dp.data_type === 'percent' ? ' %' : '') : '-';
            }
            return [
              dp.official_id || '-',
              dp.name || '-',
              dp.data_type || '-',
              value,
              dp.response.evidence_reference || '-',
              dp.response.status || '-',
            ];
          });

          autoTable(doc, {
            startY: y,
            head: [['ID', 'DataPoint', 'Type', 'Value', 'Evidence', 'Status']],
            body: dpBody,
            theme: 'striped',
            headStyles: { fillColor: [214, 220, 195], textColor: 0, fontStyle: 'bold', fontSize: 8 },
            styles: { font: 'times', fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
            columnStyles: {
              0: { cellWidth: 55 },
              1: { cellWidth: 130 },
              2: { cellWidth: 40 },
              3: { cellWidth: 'auto' },
              4: { cellWidth: 70 },
              5: { cellWidth: 45 },
            },
            margin: { left: marginL + 10, right: marginR },
          });

          y = doc.lastAutoTable.finalY + 12;
        }
        y += 10;
      }

      // ---- PIE ----
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('times', 'normal');
        doc.setFontSize(8);
        doc.setTextColor('#888888');
        doc.text(`Generated: ${new Date().toLocaleDateString()} — Page ${i} of ${totalPages}`, marginL, doc.internal.pageSize.getHeight() - 20);
        doc.setTextColor('#000000');
      }

      doc.save(`csrd-report-${row.id}.pdf`);
    },
    addJustifiedText: function(doc, text, x, y, maxWidth, lineHeight) {
      const paragraphs = text.split('\n'); // separar por párrafos
      let currentY = y;

      paragraphs.forEach(paragraph => {
          const words = paragraph.trim().split(/\s+/);
          let lineWords = [];
          let lineWidth = 0;

          words.forEach((word) => {
              const wordWidth = doc.getTextWidth(word + " ");
              if (lineWidth + wordWidth > maxWidth && lineWords.length > 0) {
                  // Justificar línea actual
                  const totalWordsWidth = lineWords.reduce((sum, w) => sum + doc.getTextWidth(w), 0);
                  const spaceCount = lineWords.length - 1;
                  const extraSpace = spaceCount > 0 ? (maxWidth - totalWordsWidth) / spaceCount : 0;

                  let currentX = x;
                  lineWords.forEach((w, i) => {
                      doc.text(w, currentX, currentY);
                      currentX += doc.getTextWidth(w) + extraSpace;
                  });

                  currentY += lineHeight;
                  lineWords = [];
                  lineWidth = 0;
              }

              lineWords.push(word);
              lineWidth += wordWidth;
          });

          // Última línea del párrafo → alineada izquierda
          let currentX = x;
          lineWords.forEach((w) => {
              doc.text(w, currentX, currentY);
              currentX += doc.getTextWidth(w) + doc.getTextWidth(" ");
          });
          currentY += lineHeight * 1.2; // añadir pequeño espacio extra entre párrafos
      });

      return currentY;
}
  },
}
</script>

<style scoped lang="scss">
.custom-section {
  padding: 40px;
  display: flex;
  flex-direction: column;
}

.custom-pagination {
  display:flex; 
  justify-content: flex-end; 
  align-items: end; 
  margin-bottom: 30px;
}

</style>