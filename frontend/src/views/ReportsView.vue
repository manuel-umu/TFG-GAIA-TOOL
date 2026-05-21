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
      loadingRowId: null,

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
          loadingCondition: (row) => this.loadingRowId === row.id,
          if: (row) => !row.framework_code,
        },
        {
          icon: 'mdi mdi-leaf',
          event: 'report-csrd',
          loadingCondition: (row) => this.loadingRowId === row.id,
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
      this.loadingRowId = row.id;
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

        // Combinar indicadores con resultados
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

        // Agrupar por dimensión
        const indicatorsByDimension = combinedIndicators.reduce((acc, ind) => {
          if (!acc[ind.dimension]) acc[ind.dimension] = [];
          acc[ind.dimension].push(ind);
          return acc;
        }, {});

        // Iterar dimensiones
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
          y = doc.lastAutoTable.finalY + 20; 
        });

        // Espacio extra entre procesos
        y += 20;
      });

      this.loadingRowId = null;
      doc.save("ahp-sustainability-report.pdf");
    },
    async exportCsrdPDF(row) {
      this.loadingRowId = row.id;
      const { data } = await axiosInstance.get(`/audits/${row.id}/report/data`);
      const doc = new jsPDF('p', 'pt');
      const pageWidth = doc.internal.pageSize.getWidth();
      const centerX = pageWidth / 2;

      // --- PORTADA ---
      if (data.organization.logo_url) {
        const w = pageWidth * 0.5;
        doc.addImage(data.organization.logo_url, centerX - w / 2, 30, w, 200);
      } else {
        doc.setFont("times", "bold");
        doc.setFontSize(36);
        doc.setTextColor("#98A869");
        doc.text("GAIA-TOOL", centerX, 200, { align: "center" });
      }

      doc.setFont("times", "bold");
      doc.setFontSize(30);
      doc.setTextColor("#98A869");
      doc.text("Sustainability Statement", centerX, 380, { align: "center" });
      doc.text("under CSRD", centerX, 420, { align: "center" });

      doc.setFontSize(18);
      doc.setTextColor("#000000");
      doc.text(data.organization.name, centerX, 470, { align: "center" });

      if (data.audit.reporting_year) {
        doc.setFont("times", "normal");
        doc.setFontSize(14);
        doc.setTextColor("#555555");
        doc.text(`Fiscal Year ${data.audit.reporting_year}`, centerX, 500, { align: "center" });
      }

      doc.setFont("times", "italic");
      doc.setFontSize(11);
      doc.setTextColor("#666666");
      doc.text("Prepared in accordance with the", centerX, 540, { align: "center" });
      doc.text("European Sustainability Reporting Standards (ESRS)", centerX, 558, { align: "center" });

      // Footer portada
      doc.setDrawColor("#98A869");
      doc.setLineWidth(2);
      doc.line(40, 780, pageWidth - 40, 780);
      doc.setFont("times", "normal");
      doc.setFontSize(9);
      doc.setTextColor("#444444");
      const colW = (pageWidth - 80) / 3;
      doc.text(`Auditor: ${data.auditor.name}`, 40 + colW * 0.5, 798, { align: "center" });
      doc.text(`Manager: ${data.manager.name}`, 40 + colW * 1.5, 798, { align: "center" });
      doc.text(`Generated: ${this.formatReportDate(data.generatedAt)}`, 40 + colW * 2.5, 798, { align: "center" });

      // --- INFORMACION GENERAL ---
      doc.addPage();
      let y = 50;
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.setTextColor("#000000");
      doc.text("1. Audit Information", 40, y);
      y += 22;

      doc.setFont("times", "normal");
      doc.setFontSize(12);
      doc.text(`Name: ${data.audit.name}`, 40, y);
      y += 18;
      if (data.audit.description) {
        y = this.addJustifiedText(doc, `Description: ${data.audit.description}`, 40, y, pageWidth - 80, 18);
        y += 6;
      }
      doc.text(`Organization: ${data.organization.name}`, 40, y); y += 18;
      doc.text(`Auditor: ${data.auditor.name}`, 40, y); y += 18;
      doc.text(`Manager: ${data.manager.name}`, 40, y); y += 18;
      doc.text(`Framework: ${data.framework.code}`, 40, y); y += 18;
      doc.text(`Period: ${this.formatReportDate(data.audit.init_date)} - ${this.formatReportDate(data.audit.end_date)}`, 40, y);
      y += 30;

      // --- DOBLE MATERIALIDAD ---
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text("2. Double Materiality Assessment", 40, y);
      y += 16;

      autoTable(doc, {
        startY: y,
        head: [["Code", "Standard", "Category", "Mandatory", "Materiality", "Justification"]],
        body: data.materiality.standards.map(s => [
          s.code,
          s.name,
          s.category || "-",
          s.is_mandatory ? "Yes" : "No",
          s.assessment.is_material ? "Material" : "Not material",
          s.assessment.justification || "-",
        ]),
        theme: "grid",
        headStyles: { fillColor: [152, 168, 105], textColor: 0, fontStyle: "bold" },
        styles: { font: "times", fontSize: 9, cellPadding: 4, overflow: "linebreak" },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 80 },
          2: { cellWidth: 70 },
          3: { cellWidth: 55 },
          4: { cellWidth: 60 },
          5: { cellWidth: 210 },
        },
        margin: { left: 40, right: 40 },
      });
      y = doc.lastAutoTable.finalY;

      // --- DATAPOINTS ---
      if (y > 500) {
        doc.addPage();
        y = 50;
      } else {
        y += 40;
      }

      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text("3. CSRD DataPoints", 40, y);
      y += 22;

      data.questionnaire.standards.filter(s => s.has_content).forEach(std => {
        if (y > 700) { 
          doc.addPage(); 
          y = 50; 
        }
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.text(`${std.code} — ${std.name}`, 40, y);
        y += 14;

        if (std.description) {
          doc.setFont("times", "italic");
          doc.setFontSize(9.5);
          doc.setTextColor("#555555");
          y = this.addJustifiedText(doc, std.description, 40, y, pageWidth - 80, 13);
          doc.setTextColor("#000000");
          y += 8;
        }

        std.disclosure_requirements.forEach(dr => {
          if (y > 750) { 
            doc.addPage(); 
            y = 50; 
          }
          doc.setFont("times", "italic");
          doc.setFontSize(11);
          doc.text(`${dr.code} — ${dr.name}`, 40, y);

          if (dr.reported_data_points.length > 0) {
            y += 8;
            autoTable(doc, {
              startY: y + 6,
              head: [["ID", "DataPoint", "Type", "Value", "Evidence", "Status"]],
              body: dr.reported_data_points.map(dp => [
                dp.official_id,
                dp.name,
                dp.data_type,
                this.formatDataPointValue(dp.response, dp.data_type),
                dp.response?.evidence_reference || "-",
                dp.response?.status || "-",
              ]),
              theme: "grid",
              headStyles: { fillColor: [152, 168, 105], textColor: 0, fontStyle: "bold" },
              styles: { font: "times", fontSize: 8.5, cellPadding: 3, overflow: "linebreak" },
              columnStyles: {
                0: { cellWidth: 45 },
                1: { cellWidth: 120 },
                2: { cellWidth: 40 },
                3: { cellWidth: 210 },
                4: { cellWidth: 60 },
                5: { cellWidth: 45 },
              },
              margin: { left: 40, right: 40 },
            });
            y = doc.lastAutoTable.finalY;
          }
          if (dr.na_data_points.length > 0) {
            y += 12;
            doc.setFont("times", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor("#888888");
            doc.text("Not applicable to this organization", 40, y);
            doc.setTextColor("#000000");

            autoTable(doc, {
              startY: y + 4,
              head: [["ID", "DataPoint", "Reason"]],
              body: dr.na_data_points.map(dp => [
                dp.official_id,
                dp.name,
                dp.response?.value_text || "Not applicable",
              ]),
              theme: "grid",
              headStyles: { fillColor: [216, 221, 202], textColor: 0, fontStyle: "bold" },
              styles: { font: "times", fontSize: 8, cellPadding: 3, textColor: [119, 119, 119], overflow: "linebreak" },
              columnStyles: {
                0: { cellWidth: 45 },
                1: { cellWidth: 240 },
                2: { cellWidth: 235 },
              },
              margin: { left: 40, right: 40 },
            });
            y = doc.lastAutoTable.finalY;
          }
          y += 20;
        });

        y += 10;
      });

      this.loadingRowId = null;
      doc.save(`csrd-report-${row.id}.pdf`);
    },
    formatReportDate(value) {
      if (!value) return "-";
      const d = new Date(value);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      return `${dd}/${mm}/${d.getFullYear()}`;
    },
    formatDataPointValue(response, dataType) {
      if (!response || !response.value_text) return "-";
      const v = response.value_text;
      if (dataType === "boolean") return v === true || v === "true" ? "Yes" : "No";
      const numericTypes = ["integer", "numeric", "percent", "monetary", "decimal", "value"];
      if (numericTypes.includes(dataType)) {
        const num = Number(v);
        if (Number.isNaN(num)) return String(v);
        return num.toLocaleString("en-US", { maximumFractionDigits: 2 }) + (dataType === "percent" ? " %" : "");
      }
      return String(v);
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