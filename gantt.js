if($===undefined){
    console.log('jquery required!')
}
if($.ganttdata===undefined){
    $.ganttdata = {
        core:{}
    }
}
$.gantt = function(){
    function outline(){
        return {
            projects:{},
            resources:[],
            timeslots:[],
            assignments:{},
            tmp:{}
        }
    }
    
    //What are the gantts on this page? (so that we can have multiple)
    $('table[data-gantt-id]').each(function(){
        let id = $(this).attr('data-gantt-id')
        $.ganttdata[id] = outline()
        $.ganttdata[id].references = outline()
    })
    
    //Process the projects tables
    function processProject(id){
        return function(){
            $(this).append("<td>0</td>")
            let data = $('td',this)
            let projectid = $(data[0]).text()
            
            $.ganttdata[id].projects[projectid] = {
                color:                  $(data[1]).text(),
                customer:               $(data[2]).text(),
                estimate:      parseInt($(data[3]).text()),
                deadline:               $(data[4]).text(),
                slotsAllotted: parseInt($(data[5]).text()),       
            }
            $.ganttdata[id].references.projects[projectid] = {
                project:             $(data[0]),
                color:               $(data[1]),
                customer:            $(data[2]),
                estimate:            $(data[3]),
                deadline:            $(data[4]),
                slotsAllotted:       $(data[5]) 
            }

            $(data[0]).attr('data-gantt-projectid',$(data[0]).text())
                      .click({id},selectProject)

            // Making the cells editable
            let ganttTable = $(`table[data-gantt-role="gantt"][data-gantt-id="${id}"]`)
            let projectAssignments = $(`td[data-gantt-projectid="${projectid}"]`, ganttTable)

            let projectTitleChanged = function(e){
                projectAssignments.text($(this).val())
            }
            let projectColorChanged = function(){
                $.ganttdata[id].projects[projectid].color = $(this).val()
                projectAssignments.css('background-color',$(this).val())
            }
            let deadlineChanged = function(){
                $.ganttdata[id].projects[projectid].deadline = $(this).val()
                checkDeadlines(id).call(ganttTable)
            }
            let estimateChanged = function(){
                $.ganttdata[id].projects[projectid].estimate = $(this).val()
                updateSlotsRemaining(id)
            }
            let onchange = [projectTitleChanged,projectColorChanged,undefined,estimateChanged,deadlineChanged]
            let types = ["text","color","text","text","text"]
            
            for(i=0; i<5; i++){
                let cell = $(data[i])
                let text = cell.text()
                cell.html(`<input type="${types[i]}" value="${text}">`)
                if(onchange[i]!==undefined){
                    $('input',cell).change(onchange[i])
                }
            }
        }
    }
    $('table[data-gantt-role="projects"]').each(function (){
        let id = $(this).attr('data-gantt-id')
        $('thead tr',this).append('<th>Slots Remaining</th>')
        $('tbody tr',this).each(processProject(id))
    })
    
    function processResource(id){
        return function(){
            let resource = $(this).text()
            $.ganttdata[id].resources.push(resource)
            $(this).html(`<input type="text" value="${resource}">`)
                   .attr('data-gantt-resourceid',resource)
        }
    }

    function processTimeslot(id){
        return function(){
            let timeslot = $(this).text()
            $.ganttdata[id].timeslots.push(timeslot)
            $(this).html(`<input type="text" value="${timeslot}">`)
                   .attr('data-gantt-timeslotid',timeslot)
            $('input',this).change(function(){$.ganttdata.core.checkDeadlines.call($(this).closest('table'))})
        }
    }
    function processAssignment(id){
        return function(){
            let project = $(this).text()
            let timeslot = $('td:first-child input',$(this.parentNode)).val()
            let resource = $.ganttdata[id].resources[this.cellIndex]
            
            if($.ganttdata[id].assignments[timeslot]==undefined){
                $.ganttdata[id].assignments[timeslot]={}
            }
            $.ganttdata[id].assignments[timeslot][resource]=project
            $(this).click({timeslot,resource,id},toggleAssignment)

            if($.ganttdata[id].projects[project]!=undefined){
                $.ganttdata[id].projects[project].slotsAllotted++
                $(this).css('background-color',$.ganttdata[id].projects[project].color)
                       .attr('data-gantt-projectid',project)
            }
        }
    }
    
    function checkDeadlines(id){
        return function(){
            $('table[data-gantt-role="gantt"] .deadline,table[data-gantt-role="gantt"] .deadline-before,table[data-gantt-role="gantt"] .deadline-after')
                .removeClass('deadline')
                .removeClass('deadline-before')
                .removeClass('deadline-after')
                .css('border-color','')

            for(let projectKey in $.ganttdata[id].projects){
                let project =   $.ganttdata[id].projects[projectKey]
                let deadline =  project.deadline.toLowerCase()
                let projectColor = project.color

                let timeslotRows = $(`table[data-gantt-role="gantt"][data-gantt-id="${id}"] tbody tr:not(:last-child)`)
                let timeslots =  $('td:first-child input',timeslotRows).map(function(){
                    return $(this).val().toLowerCase()
                })
                
                if(deadline.toLowerCase().startsWith('end of')){
                    let lastTime = undefined
                    let cleanedDeadline = deadline.replace('end of','').trim()
                    timeslots.each(function(index,timeslot){
                        if(timeslot.includes(cleanedDeadline)){
                            lastTime = index
                        }
                    })
                    if(lastTime!==undefined){
                        $(timeslotRows[lastTime]).addClass('deadline')
                                                .addClass('deadline-after')
                                                .css('border-color', projectColor)
                    }
                }
                else if(deadline.toLowerCase().startsWith('start of')){
                    let firstTime = undefined
                    let cleanedDeadline = deadline.replace('start of','').trim()
                    timeslots.each(function(index,timeslot){
                        if(timeslot.includes(cleanedDeadline)){
                            firstTime = index
                            return
                        }
                    })
                    if(firstTime!==undefined){
                        $(timeslotRows[firstTime]).addClass('deadline')
                                                .addClass('deadline-before')
                                                .css('border-color', projectColor)
                    }
                }
                else {
                    let firstTime = undefined
                    let deadlineCleaned = deadline.trim()
                    timeslots.each(function(index,timeslot){
                        if(timeslot.includes(deadlineCleaned)){
                            firstTime = index
                            return
                        }
                    })
                    if(firstTime!==undefined){
                        $(timeslotRows[firstTime]).addClass('deadline')
                                                .addClass('deadline-before')
                                                .css('border-color', projectColor)
                    }
                }   
            }
        }
    }
    //Process the actual gantt tables
    $('table[data-gantt-role="gantt"]').each(function(){
        var id = $(this).attr('data-gantt-id')
        
        $('thead tr:first-child th',this).slice(1).each(processResource(id))
        
        $('tbody tr td:first-child',this).each(processTimeslot(id))
        
        $(this).each(checkDeadlines(id))

        $('tbody tr td:not(:first-child)',this).each(processAssignment(id))

    })

    //Output slots remaining
    $('table[data-gantt-role="projects"]').each(function (){
        let id = $(this).attr('data-gantt-id')

        updateSlotsRemaining(id)
    })


    function updateSlotsRemaining(id){
        for(let projectKey in $.ganttdata[id].projects){
            let project = $.ganttdata[id].projects[projectKey]
            let slotsRemainingCell = $.ganttdata[id].references.projects[projectKey].slotsAllotted
            let slotsRemaining = project.estimate - project.slotsAllotted
            
            if(slotsRemaining!==NaN){
                slotsRemainingCell.text(slotsRemaining)
                slotsRemainingCell.toggleClass('slotFeedback',slotsRemaining!==0)
            }
        }
    }

    function selectProject(event){
        $(`table[data-gantt-role="projects"][data-gantt-id="${event.data.id}"] td`).removeClass('selectedProject')

        let projectid = $(this).attr('data-gantt-projectid')

        if($.ganttdata[event.data.id].tmp.selectedproject == projectid){
            $.ganttdata[event.data.id].tmp.selectedproject = undefined
        }
        else{
            $.ganttdata[event.data.id].tmp.selectedproject = projectid
            $(this).addClass('selectedProject')
        }
    }

    function toggleAssignment(event){
        let timeslot = event.data.timeslot
        let resource = event.data.resource
        let id = event.data.id

        let selectedProject = $.ganttdata[id].tmp.selectedproject
        if(selectedProject === undefined){
            return
        }

        let currentProject = $.ganttdata[id].assignments[timeslot][resource]
        
  
        if(currentProject == selectedProject){
            $(this).text('')
                   .css('background-color','')
                   .attr('data-gantt-projectid','')
            $.ganttdata[id].assignments[timeslot][resource] = '';
            if($.ganttdata[id].projects[selectedProject].slotsAllotted!==undefined){
                $.ganttdata[id].projects[selectedProject].slotsAllotted--
            }
        }
        else{
            $(this).text($('input',$.ganttdata[id].references.projects[selectedProject].project).val())
                   .css('background-color', $.ganttdata[id].projects[selectedProject].color)
                   .attr('data-gantt-projectid',selectedProject)
            $.ganttdata[id].assignments[timeslot][resource] = selectedProject
            if($.ganttdata[id].projects[selectedProject].slotsAllotted!==undefined){
                $.ganttdata[id].projects[selectedProject].slotsAllotted++
            }

            if($.ganttdata[id].projects[currentProject]!==undefined){
                $.ganttdata[id].projects[currentProject].slotsAllotted--
            }
            
        }
        updateSlotsRemaining(id)
    }

    function addNewProjectButton(id){
        let table = undefined;
        if(id===undefined){
            table = $('table[data-gantt-role="projects"]')
        }
        else{
            table = $(`table[data-gantt-role="projects"][data-gantt-id="${id}"]`)
        }
        
        let buttonRow = $('<tr class="button-only"><td><button><input type="button" value="+"></button></td></tr>')
        buttonRow.click(function(){
            let table = $(this).closest('table')
            $(this).remove()

            let randomcolor = '#'+(''+Math.floor(Math.random()*255).toString(16)).padStart(2,'0')+(''+Math.floor(Math.random()*255).toString(16)).padStart(2,'0')+(''+Math.floor(Math.random()*255).toString(16)).padStart(2,'0')
            let uniqueprojectname = 'Project ' + Math.floor(Math.random()*1000+999)
            
            let id = table.attr('data-gantt-id')
            let tableBody = $('tbody',table)
            tableBody.append(`<tr><td>${uniqueprojectname}</td><td>${randomcolor}</td>${'<td>'.repeat(3)}</tr>`)

            $('tr:last-child',tableBody).each(processProject(id))
            addNewProjectButton(id)
        })
        let tableBody = $('tbody',table)
        tableBody.append(buttonRow)
    }addNewProjectButton()
    
    function addNewResourceButton(id){
        let table = undefined
        if(id===undefined){
            table = $('table[data-gantt-role="gantt"]')
        }
        else{
            table = $(`table[data-gantt-role="gantt"][data-gantt-id="${id}"]`)
        }
        
        let buttonCell = $('<th class="button-only"><button><input type="button" value="+"></button></th>')
        buttonCell.click(function(){
            let table = $(this).closest('table')
            $(this).remove()

            var resource = 'Team ' + Math.floor(Math.random()*1000+999)

            let resourceRow = $('thead tr:last-child',table)
            resourceRow.append(`'<th>${resource}</th>`)
            $("tbody tr",table).append(`<td>`)

            var id = table.attr('data-gantt-id')
            $('thead tr th:last-child',table).each(processResource(id))
            $('tbody tr td:last-child',table).each(processAssignment(id))
            
            addNewResourceButton(id)        
        })
        let resourceRow = $('thead tr:last-child',table)
        resourceRow.append(buttonCell)
    }addNewResourceButton()

    function addNewTimeslotButton(id){
        let table = undefined
        if(id===undefined){
            table = $('table[data-gantt-role="gantt"]')
        }
        else{
            table = $(`table[data-gantt-role="gantt"][data-gantt-id="${id}"]`)
        }
        
        let buttonRow = $('<tr class="button-only"><td><button><input type="button" value="+"></button></td></tr>')
        buttonRow.click(function(){
            let table = $(this).closest('table')
            $(this).remove()

            let timeslot = 'Week ' + Math.floor(Math.random()*1000+999)

            let numberOfCells = $('tbody tr:first-child',table)[0].cells.length
            let tr = $('<tr>')
            tr.append(`<td>${timeslot}</td>${'<td>'.repeat(numberOfCells-1)}`)
            $("tbody",table).append(tr)

            var id = table.attr('data-gantt-id')
            $('tbody tr:last-child td:first-child',table).each(processTimeslot(id))
            $('tbody tr:last-child td:not(:first-child)',table).each(processAssignment(id))

            addNewTimeslotButton(table.attr('data-gantt-id'))
        })
        table.append(buttonRow)
    }addNewTimeslotButton()
}
$(function() {
    $.gantt()
    console.log('consider making my buttons "outside" of my tables, and/or at the start of my tables and positioned absolutely so that I don\'t have to remove and re-add them.')
})